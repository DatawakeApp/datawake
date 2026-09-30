/**
 * TCF pre-consent vendor count, "N companies claimed the right to track you".
 *
 * Shared by Chrome (tcf-probe.content.ts, MAIN world, passes `window`) and Firefox (content.ts,
 * passes `window.wrappedJSObject` and wraps the callback with `exportFunction`). Neither route is a
 * page-injected <script>, so both are immune to the page's CSP.
 */
import { countDisclosedVendors } from './disclosed';

export interface TcData {
  eventStatus?: string;
  tcString?: string;
  vendor?: {
    consents?: Record<string, boolean>;
    legitimateInterests?: Record<string, boolean>;
  };
}

export interface TcfProbeReport {
  /** The CMP has loaded (first tcloaded/cmpuishown/useractioncomplete), auto-reject may proceed. */
  ready: true;
  /** Best vendor count so far (0 if not yet known). */
  count: number;
}

type TcfCallback = (data: TcData, success: boolean) => void;
type TcfApi = (command: string, version: number, callback: TcfCallback) => void;

const CMP_EVENTS = new Set(['tcloaded', 'cmpuishown', 'useractioncomplete']);
const POLL_MS = 200;
const GIVE_UP_MS = 12_000;

/**
 * Vendors claiming the right to track: the larger of the TCData vendor-map keys (populated by some
 * CMPs before consent) and the TC string's DisclosedVendors segment (survives a reject; populated
 * by CMPs that leave the maps empty, like Didomi).
 */
export function vendorCountFromTcData(d: TcData): number {
  const keys = Object.keys({ ...d.vendor?.legitimateInterests, ...d.vendor?.consents }).length;
  return Math.max(keys, countDisclosedVendors(d.tcString) ?? 0);
}

export interface TcfProbeOptions {
  getWindow: () => Record<string, unknown> | null | undefined;
  post: (report: TcfProbeReport) => void;
  /** Firefox: `(fn) => exportFunction(fn, window)` so page code can call our callback. */
  wrapCallback?: <T extends TcfCallback>(fn: T) => T;
}

/** Wait for `__tcfapi`, then report readiness once and the vendor count whenever it grows. */
export function startTcfProbe({ getWindow, post, wrapCallback = (fn) => fn }: TcfProbeOptions): void {
  let ready = false;
  let best = 0;

  const onEvent: TcfCallback = (data, success) => {
    if (!success || !data || !CMP_EVENTS.has(data.eventStatus ?? '')) return;
    const count = vendorCountFromTcData(data);
    if (ready && count <= best) return;
    ready = true;
    best = Math.max(best, count);
    post({ ready: true, count: best });
  };

  const attach = (): boolean => {
    const api = getWindow()?.['__tcfapi'];
    if (typeof api !== 'function') return false;
    try {
      (api as TcfApi)('addEventListener', 2, wrapCallback(onEvent));
    } catch {
      // CMP API threw, best-effort.
    }
    return true;
  };

  const timer = setInterval(() => {
    if (attach()) clearInterval(timer);
  }, POLL_MS);
  // If no CMP appeared by then, there's nothing to read.
  setTimeout(() => clearInterval(timer), GIVE_UP_MS);
}
