/**
 * CMP auto-reject via native JavaScript APIs, shared by Chrome and Firefox.
 *
 * DOM-clicking the "Reject" button fails when a CMP renders its banner in a shadow DOM or an
 * iframe our content script can't reach (e.g. Consentmanager on Wallapop). Calling the CMP's own
 * "reject all" API on the *page* window is the reliable route.
 *
 * How each browser reaches the page window:
 *  - Chrome MV3: a `world: 'MAIN'` content script passes `window` (cmp-reject.content.ts).
 *  - Firefox MV2: no MAIN world, but the isolated content script can waive Xray vision with
 *    `window.wrappedJSObject` and call page functions directly (content.ts). Like MAIN world,
 *    this is not a page-injected <script>, so it is immune to the page's CSP.
 */

export type CmpName = 'consentmanager' | 'onetrust' | 'didomi' | 'usercentrics' | 'cookiebot';

// `any`: CMP globals are untyped third-party page objects; every access is guarded by typeof + try.
type PageWindow = Record<string, any>;

interface CmpEntry {
  name: CmpName;
  /** The CMP's reject-all API is present on the page. */
  present: (w: PageWindow) => boolean;
  reject: (w: PageWindow) => void;
}

const CMPS: readonly CmpEntry[] = [
  // Consentmanager, __cmp('setConsent', 0) = reject all. `__cmp` alone isn't enough: it was the
  // generic TCF v1 API name, still shimmed by other CMPs; Consentmanager's forwards to `cmpmngr`.
  {
    name: 'consentmanager',
    present: (w) => typeof w.__cmp === 'function' && w.cmpmngr != null,
    reject: (w) => w.__cmp('setConsent', 0),
  },
  { name: 'onetrust', present: (w) => typeof w.OneTrust?.RejectAll === 'function', reject: (w) => w.OneTrust.RejectAll() },
  {
    name: 'didomi',
    present: (w) => typeof w.Didomi?.setUserDisagreeToAll === 'function',
    reject: (w) => w.Didomi.setUserDisagreeToAll(),
  },
  {
    name: 'usercentrics',
    present: (w) => typeof w.UC_UI?.denyAllConsents === 'function',
    reject: (w) => w.UC_UI.denyAllConsents(),
  },
  { name: 'cookiebot', present: (w) => typeof w.Cookiebot?.decline === 'function', reject: (w) => w.Cookiebot.decline() },
];

/** The first known CMP whose reject API is present on `w` (property access errors → skipped). */
export function detectCmp(w: PageWindow | null | undefined): CmpName | null {
  if (!w) return null;
  for (const cmp of CMPS) {
    try {
      if (cmp.present(w)) return cmp.name;
    } catch {
      // Xray / hostile getter, try the next one.
    }
  }
  return null;
}

/**
 * Reject all consent via the first known CMP API present on `w`. Returns the CMP's name, or null
 * if none is present. A CMP whose API throws is skipped (best-effort), so the next one is tried.
 */
export function rejectViaCmpApi(w: PageWindow | null | undefined): CmpName | null {
  if (!w) return null;
  for (const cmp of CMPS) {
    try {
      if (!cmp.present(w)) continue;
      cmp.reject(w);
      return cmp.name;
    } catch {
      // CMP API (or an Xray property access) threw, try the next one.
    }
  }
  return null;
}

export const CMP_POLL_MS = 400;
export const CMP_GIVE_UP_MS = 15_000;
/** Longest we hold a reject back on a TCF page while waiting for the vendor count. */
export const TCF_WAIT_MS = 5_000;

export interface WaitGate {
  isReady(): boolean;
}

export interface TcfGate extends WaitGate {
  /** Call when the TCF vendor count has been read (the probe posted {__dw, t:'TCF'}). */
  markCaptured(): void;
}

/**
 * Hold auto-reject until the TCF vendor count has been captured. Rejecting first empties the CMP's
 * vendor maps (verified on Consentmanager/Wallapop: 1024 vendors → 0), which would lose the
 * "N companies claimed the right to track you" number. Pages without a TCF API aren't held, and we
 * never wait more than TCF_WAIT_MS after the TCF API appears, so a broken CMP can't block rejecting.
 */
export function createTcfGate(hasTcfApi: () => boolean, now: () => number = Date.now): TcfGate {
  let captured = false;
  let tcfSeenAt: number | null = null;
  return {
    markCaptured: () => {
      captured = true;
    },
    isReady: () => {
      if (captured || !hasTcfApi()) return true;
      tcfSeenAt ??= now();
      return now() - tcfSeenAt >= TCF_WAIT_MS;
    },
  };
}

/** Longest we wait, once a CMP is present, for its banner to render before deciding. */
export const BANNER_WAIT_MS = 4_000;

/**
 * Hold an API reject until the CMP's banner is visible, so a consent-or-pay wall can be recognised
 * first (CMP APIs can be ready before the banner renders, seen live on elmundo.es). If no banner
 * ever renders (e.g. a returning visitor), proceed after BANNER_WAIT_MS. The clock starts on the
 * first isReady() call, which the reject loop makes only once a CMP is present.
 */
export function createBannerGate(hasBanner: () => boolean, now: () => number = Date.now): WaitGate {
  let firstCheckAt: number | null = null;
  return {
    isReady: () => {
      if (hasBanner()) return true;
      firstCheckAt ??= now();
      return now() - firstCheckAt >= BANNER_WAIT_MS;
    },
  };
}

export interface CmpRejectLoopOptions {
  /** The page window to call CMP APIs on (re-read each tick; CMPs load asynchronously). */
  getWindow: () => PageWindow | null | undefined;
  /** Gate: only reject while the user's auto-reject setting is on. */
  isEnabled: () => boolean;
  /** Optional hold, e.g. a TcfGate: rejecting waits until this is true (checked each tick). */
  isReady?: () => boolean;
  /** Checked once a CMP is present and ready; true = don't reject (e.g. a consent-or-pay wall). */
  shouldSkip?: () => boolean;
  /** Called once, after a successful reject. */
  onRejected: (cmp: CmpName) => void;
  /** Called once, if shouldSkip stopped the reject. */
  onSkipped?: (cmp: CmpName) => void;
}

/**
 * Poll for a known CMP and reject through its API, at most once, for up to CMP_GIVE_UP_MS, unless
 * `shouldSkip` says not to once the CMP is ready.
 */
export function startCmpRejectLoop({
  getWindow,
  isEnabled,
  isReady = () => true,
  shouldSkip = () => false,
  onRejected,
  onSkipped = () => {},
}: CmpRejectLoopOptions): void {
  const timer = setInterval(() => {
    if (!isEnabled()) return;
    const w = getWindow();
    const present = detectCmp(w);
    if (!present || !isReady()) return;
    if (shouldSkip()) {
      clearInterval(timer);
      onSkipped(present);
      return;
    }
    const cmp = rejectViaCmpApi(w);
    if (cmp) {
      clearInterval(timer);
      onRejected(cmp);
    }
  }, CMP_POLL_MS);
  // If no known CMP appeared by then, there's nothing to do.
  setTimeout(() => clearInterval(timer), CMP_GIVE_UP_MS);
}
