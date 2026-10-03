import { matchTracker } from '../lib/trackers/match';
import { registrableDomain } from '../lib/util/domains';
import { syncGpcScript } from '../lib/gpc/register';
import { restoreTabExtras, snapshotTabExtras } from '../lib/detection/tab-extras';
import type { ActionKind } from '../lib/storage/actions-summary';
import { addFpReport, parseFpReport, type FpFinding } from '../lib/fingerprint/findings';
import { radarOwner } from '../lib/trackers/radar';
import { badgeFor } from '../lib/ui/badge';
import { fingerprintVendor } from '../lib/fingerprint/vendors';
import { TrackerStore } from '../lib/detection/tracker-store';
import type { ViolationRecord } from '../lib/detection/tracker-store';
import { recordHistory, saveViolation, recordAction, pruneOld } from '../lib/storage/db';
import { fingerprintersAfterReject, isReportable } from '../lib/fingerprint/after-reject';
import { getSettings } from '../lib/settings';
import { addWallSite, isDisguisedWallRedirect, WALL_SITES_KEY } from '../lib/cmp/disguised-wall';
import { isNonViolationCookie } from '../lib/cookies/categorize';

export default defineBackground(() => {
  const store = new TrackerStore();
  const tabSite = new Map<number, string>();
  const tabViolations = new Map<number, ViolationRecord | null>();
  const tabCheckingViolation = new Set<number>();
  const tabTcfCount = new Map<number, number>();
  /** Tabs whose consent banner is a consent-or-pay wall (refusing = paying); auto-reject skipped. */
  const tabPayOrOk = new Set<number>();
  /** Fingerprinting seen on each tab's current page (lib/fingerprint). */
  const tabFingerprints = new Map<number, FpFinding[]>();
  /** When the user's consent was rejected on each tab's current page (for "after Reject"). */
  const tabRejectedAt = new Map<number, number>();
  /** Actions already logged for each tab's current page (so each is recorded once per page). */
  const tabLoggedActions = new Map<number, Set<ActionKind>>();
  function logAction(tabId: number, kind: ActionKind, site: string | null): void {
    if (!site) return;
    const logged = tabLoggedActions.get(tabId) ?? new Set<ActionKind>();
    if (logged.has(kind)) return;
    tabLoggedActions.set(tabId, new Set([...logged, kind]));
    void recordAction(kind, site).catch(() => {});
  }
  // Per-tab tracker activity (registrable domain → last-seen epoch ms). Used to scope violation
  // attribution to trackers actually active ON THIS TAB after the user rejected, cookies aren't
  // tab-scoped, so this stops another tab's tracker cookie from being blamed on this site.
  const tabRequestLog = new Map<number, Map<string, number>>();
  const VIOLATION_WINDOW_MS = 4000;
  let paused = false;
  let pausedSites = new Set<string>();

  const session = (browser.storage as any).session as
    | { get(k: string): Promise<any>; set(v: any): Promise<void> }
    | undefined;
  const action = ((browser as any).action ?? (browser as any).browserAction) as any;
  const dnr = (browser as any).declarativeNetRequest;

  // Keep the static GPC ruleset (Sec-GPC: 1 header) in sync with the user's setting. Without this
  // the header would be sent even after the user turns GPC off in Settings (the JS property is
  // gated in the content script, but the header rule is otherwise always-on).
  async function syncGpcRuleset(enabled: boolean): Promise<void> {
    if (!dnr?.updateEnabledRulesets) return;
    try {
      await dnr.updateEnabledRulesets(
        enabled ? { enableRulesetIds: ['gpc'] } : { disableRulesetIds: ['gpc'] },
      );
    } catch { /* best-effort */ }
  }

  // The GPC JS signal follows the same setting: header ruleset + MAIN-world script (Chrome).
  const scripting = (browser as any).scripting;
  function syncGpc(enabled: boolean): void {
    void syncGpcRuleset(enabled);
    void syncGpcScript(scripting, enabled);
  }

  getSettings()
    .then((s) => {
      paused = s.paused;
      pausedSites = new Set(s.pausedSites ?? []);
      syncGpc(s.gpcEnabled !== false);
    })
    .catch(() => {});

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      const s = changes.settings.newValue as any;
      paused = !!s?.paused;
      pausedSites = new Set(s?.pausedSites ?? []);
      syncGpc(s?.gpcEnabled !== false);
    }
  });

  if (session) {
    session
      .get('state')
      .then((s: any) => {
        store.loadSnapshot(s?.state?.tabs);
        for (const [k, v] of Object.entries<string>(s?.state?.sites ?? {})) tabSite.set(Number(k), v);
        // Violations / vendor counts / pay-or-OK flags survive a service-worker restart too.
        const extras = restoreTabExtras(s?.state?.extras);
        for (const [id, v] of extras.violations) if (!tabViolations.has(id)) tabViolations.set(id, v);
        for (const [id, n] of extras.tcfCounts) tabTcfCount.set(id, Math.max(tabTcfCount.get(id) ?? 0, n));
        for (const id of extras.payOrOk) tabPayOrOk.add(id);
        for (const [id, f] of extras.fingerprints) if (!tabFingerprints.has(id)) tabFingerprints.set(id, f);
        for (const [id, at] of extras.rejectedAt) if (!tabRejectedAt.has(id)) tabRejectedAt.set(id, at);
      })
      .catch(() => {});
  }

  let persistTimer: ReturnType<typeof setTimeout> | undefined;
  const persist = (): void => {
    if (!session) return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      void session
        .set({
          state: {
            tabs: store.snapshot(),
            sites: Object.fromEntries(tabSite),
            extras: snapshotTabExtras(tabViolations, tabTcfCount, tabPayOrOk, tabFingerprints, tabRejectedAt),
          },
        })
        .catch(() => {});
    }, 800);
  };

  // Neutral count; red only when the site tracked or fingerprinted you after you said no.
  const updateBadge = (tabId: number): void => {
    if (!action?.setBadgeText) return;
    const { knownCount } = store.getForTab(tabId);
    const caughtAfterReject =
      Boolean(tabViolations.get(tabId)) ||
      (tabFingerprints.get(tabId) ?? []).some((f) => f.afterReject && f.purpose !== 'security');
    const badge = badgeFor({ trackers: knownCount, caughtAfterReject });
    action.setBadgeText({ tabId, text: badge.text });
    action.setBadgeBackgroundColor?.({ tabId, color: badge.color });
  };

  // Disguised pay walls (lib/cmp/disguised-wall.ts): if Reject sent the tab to a subscription page,
  // remember the site, go back, and let the reloaded page show the pay-or-OK notice instead.
  // The page each tab was on when Reject was clicked (from the reject message itself).
  const tabRejectedUrl = new Map<number, string>();
  const catchDisguisedWall = (tabId: number, toUrl: string): boolean => {
    const rejectedAt = tabRejectedAt.get(tabId);
    const fromUrl = tabRejectedUrl.get(tabId);
    const fromSite = fromUrl ? registrableDomain(fromUrl) : null;
    if (!fromSite || rejectedAt === undefined || !fromUrl) return false;
    if (!isDisguisedWallRedirect({ fromSite, toUrl, msSinceReject: Date.now() - rejectedAt })) return false;
    tabRejectedAt.delete(tabId); // the reject didn't count, and this must not loop
    tabRejectedUrl.delete(tabId);
    persist();
    void (async () => {
      try {
        const stored = await browser.storage.local.get(WALL_SITES_KEY);
        const list = Array.isArray(stored[WALL_SITES_KEY]) ? (stored[WALL_SITES_KEY] as string[]) : [];
        await browser.storage.local.set({ [WALL_SITES_KEY]: addWallSite(list, fromSite) });
        await browser.tabs.update(tabId, { url: fromUrl });
      } catch (err) {
        console.warn('[datawake] could not undo a disguised pay wall redirect', err);
      }
    })();
    return true;
  };

  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const { tabId } = details;
      if (tabId < 0 || paused) return;

      if (details.type === 'main_frame') {
        if (catchDisguisedWall(tabId, details.url)) return;
        const site = registrableDomain(details.url);
        tabRejectedUrl.delete(tabId);
        tabViolationRow.delete(tabId);
        if (site) tabSite.set(tabId, site);
        store.startPage(tabId, site);
        tabViolations.delete(tabId);
        tabCheckingViolation.delete(tabId);
        tabTcfCount.delete(tabId);
        tabPayOrOk.delete(tabId);
        tabFingerprints.delete(tabId);
        tabRejectedAt.delete(tabId);
        tabLoggedActions.delete(tabId);
        tabRequestLog.delete(tabId);
        updateBadge(tabId);
        persist();
        return;
      }

      const site = tabSite.get(tabId) ?? null;
      if (site && pausedSites.has(site)) return;

      const match = matchTracker(details.url, site);
      if (!match) return;

      // Record this tracker's activity on this tab (used to scope violation attribution).
      let reqLog = tabRequestLog.get(tabId);
      if (!reqLog) {
        reqLog = new Map<string, number>();
        tabRequestLog.set(tabId, reqLog);
      }
      reqLog.set(match.trackerDomain, Date.now());

      const firstSeen = store.record(tabId, match);
      if (firstSeen) {
        updateBadge(tabId);
        persist();
        if (site) {
          void recordHistory({
            ts: Date.now(),
            site,
            entity: match.entity,
            trackerDomain: match.trackerDomain,
            known: match.known,
            category: match.category,
          });
        }
      }
    },
    { urls: ['<all_urls>'] },
  );

  browser.tabs.onActivated.addListener(({ tabId }) => updateBadge(tabId));

  browser.tabs.onRemoved.addListener((tabId) => {
    store.clearTab(tabId);
    tabRejectedUrl.delete(tabId);
    tabViolationRow.delete(tabId);
    tabSite.delete(tabId);
    tabViolations.delete(tabId);
    tabTcfCount.delete(tabId);
    tabPayOrOk.delete(tabId);
    tabFingerprints.delete(tabId);
    tabRejectedAt.delete(tabId);
    tabLoggedActions.delete(tabId);
    tabRequestLog.delete(tabId);
    persist();
  });

  // ── Cookie helpers ─────────────────────────────────────────────────────────

  const cookiesApi = (browser as any).cookies;

  /** Snapshot cookie keys (`name|domain`) for the page plus a fixed list of tracker domains. */
  async function snapshotCookieKeys(url: string, domains: Iterable<string>): Promise<Set<string>> {
    try {
      const firstParty: any[] = await cookiesApi.getAll({ url });
      const all = [...firstParty];

      for (const d of domains) {
        try {
          const tc: any[] = await cookiesApi.getAll({ domain: d });
          all.push(...tc);
        } catch { /* ignore */ }
      }

      return new Set(all.map((c: any) => `${c.name}|${c.domain}`));
    } catch {
      return new Set();
    }
  }

  function isTrackingCookie(cookieDomain: string, tabSiteStr: string | null): boolean {
    const clean = cookieDomain.replace(/^\./, '');
    const fakeUrl = `https://${clean}/`;
    const match = matchTracker(fakeUrl, tabSiteStr);
    return match?.known === true;
  }

  // One violations-log entry per page, updated as cookie and fingerprint evidence comes in.
  // Writes are chained per tab so an update never races the first insert.
  const tabViolationRow = new Map<number, Promise<number | undefined>>();
  function recordPageViolation(tabId: number, site: string, url: string): void {
    const newCookies = tabViolations.get(tabId)?.newCookies ?? [];
    const fingerprinters = fingerprintersAfterReject(tabFingerprints.get(tabId) ?? []);
    if (!isReportable({ newCookies, fingerprinters })) return;
    const prev = tabViolationRow.get(tabId) ?? Promise.resolve(undefined);
    tabViolationRow.set(
      tabId,
      prev.then((id) =>
        saveViolation(id, { site, url, timestamp: Date.now(), newCookies, fingerprinters }).catch((err) => {
          console.warn('[datawake] could not save violation', err);
          return id;
        }),
      ),
    );
  }

  // ── Violation detection ────────────────────────────────────────────────────

  async function checkViolation(tabId: number, url: string): Promise<void> {
    const siteName = tabSite.get(tabId) ?? null;
    const rejectedAt = Date.now();

    // (#2) Freeze the set of tracker domains present at reject-time. We only judge trackers that
    // were already on the page, not ones that first appear afterwards (whose pre-existing cookies
    // would otherwise look "new"). A genuinely new tracker is caught on the next page load instead.
    const frozenDomains = [...new Set(store.getForTab(tabId).entities.flatMap((e) => e.domains))];
    const before = await snapshotCookieKeys(url, frozenDomains);

    setTimeout(async () => {
      try {
        const after = await snapshotCookieKeys(url, frozenDomains);
        const firedThisTab = tabRequestLog.get(tabId);
        const newTrackingCookies: Array<{ name: string; domain: string }> = [];

        for (const key of after) {
          if (before.has(key)) continue;

          // Keys are `name|domain`; the domain is the final segment (cookie names may contain '|').
          const sep = key.lastIndexOf('|');
          if (sep <= 0) continue;
          const name = key.slice(0, sep);
          const domain = key.slice(sep + 1);
          if (!name || !domain) continue;

          // Skip consent records, opt-out flags, security/anti-bot, and session/functional
          // cookies, these legitimately appear after a Reject and aren't tracking violations.
          if (isNonViolationCookie(name)) continue;

          // Must be a recognized tracking cookie.
          if (!isTrackingCookie(domain, siteName)) continue;

          // (#3) ...and its tracker must have actually made a request ON THIS TAB after the
          // rejection. Cookies aren't tab-scoped, so without this a cookie set by the same
          // tracker in another tab could be misattributed to this site.
          const reg = registrableDomain(domain.replace(/^\./, '')) ?? domain.replace(/^\./, '');
          const firedAt = firedThisTab?.get(reg);
          if (firedAt === undefined || firedAt < rejectedAt) continue;

          newTrackingCookies.push({ name, domain });
        }

        if (newTrackingCookies.length > 0 && tabSite.get(tabId) === siteName) {
          const violation: ViolationRecord = {
            newCookies: newTrackingCookies,
            detectedAt: Date.now(),
          };
          tabViolations.set(tabId, violation);
          persist();
          updateBadge(tabId);
          logAction(tabId, 'violation', siteName);

          if (siteName) recordPageViolation(tabId, siteName, url);
        }
      } catch { /* swallow, best-effort */ } finally {
        tabCheckingViolation.delete(tabId);
      }
    }, VIOLATION_WINDOW_MS);
  }

  // ── Message handling ───────────────────────────────────────────────────────

  browser.runtime.onMessage.addListener(async (msg: any, sender: any) => {
    if (msg?.type === 'GET_TAB_TRACKERS' && typeof msg.tabId === 'number') {
      const data = store.getForTab(msg.tabId);
      return {
        ...data,
        violation: tabViolations.get(msg.tabId) ?? null,
        tcfVendorCount: tabTcfCount.get(msg.tabId) ?? 0,
        payOrOkWall: tabPayOrOk.has(msg.tabId),
        fingerprints: tabFingerprints.get(msg.tabId) ?? [],
        bannerRejected: tabRejectedAt.has(msg.tabId),
        // Last request time per tracker domain, so the popup can show who is active right now.
        activity: Object.fromEntries(tabRequestLog.get(msg.tabId) ?? []),
      };
    }

    if (msg?.type === 'TCF_VENDOR_COUNT' && typeof msg.count === 'number') {
      const tabId = sender?.tab?.id as number | undefined;
      // Keep the highest count seen: the probe re-reports as the TC string fills in.
      if (tabId !== undefined) {
        tabTcfCount.set(tabId, Math.max(tabTcfCount.get(tabId) ?? 0, msg.count));
        persist();
      }
      return undefined;
    }

    if (msg?.type === 'PAY_OR_OK_WALL') {
      const tabId = sender?.tab?.id as number | undefined;
      if (tabId !== undefined) {
        tabPayOrOk.add(tabId);
        persist();
        const tabUrl = sender?.tab?.url as string | undefined;
        logAction(tabId, 'payOrOk', tabSite.get(tabId) ?? (tabUrl ? registrableDomain(tabUrl) : null));
      }
      return undefined;
    }

    if (msg?.type === 'FP_DETECTED') {
      const tabId = sender?.tab?.id as number | undefined;
      // Validate (page scripts can post look-alike messages) and time-stamp on our own clock.
      const report = parseFpReport({ ...msg, at: Date.now() });
      if (tabId === undefined || !report) return undefined;
      // Fall back to the tab's own URL if navigation wasn't seen (e.g. right after install), so the
      // site's own code is never mislabelled as a third party.
      const tabUrl = sender?.tab?.url as string | undefined;
      const site = tabSite.get(tabId) ?? (tabUrl ? registrableDomain(tabUrl) : null);
      tabFingerprints.set(
        tabId,
        addFpReport(tabFingerprints.get(tabId) ?? [], report, {
          site,
          rejectedAt: tabRejectedAt.get(tabId) ?? null,
          domainOf: registrableDomain,
          // Named fingerprinting vendors first: for unknown domains matchTracker echoes the domain.
          companyOf: (domain) =>
            fingerprintVendor(domain) ?? matchTracker(`https://${domain}/`, site)?.entity ?? radarOwner(domain),
        }),
      );
      persist();
      updateBadge(tabId);
      // Only real tracking counts as "fingerprinting caught", not bot/fraud checks.
      if ((tabFingerprints.get(tabId) ?? []).some((f) => f.purpose !== 'security')) logAction(tabId, 'fingerprint', site);
      if (site && tabUrl?.startsWith('http')) recordPageViolation(tabId, site, tabUrl);
      return undefined;
    }

    if (msg?.type === 'AUTO_REJECT_ALLOWED') {
      const url = sender?.tab?.url as string | undefined;
      const site = url ? registrableDomain(url) : null;
      if (!site) return true;
      const stored = await browser.storage.local.get(WALL_SITES_KEY);
      const list = Array.isArray(stored[WALL_SITES_KEY]) ? (stored[WALL_SITES_KEY] as string[]) : [];
      return !list.includes(site);
    }

    if (msg?.type === 'BANNER_REJECTED') {
      const tabId = sender?.tab?.id as number | undefined;
      const url = sender?.tab?.url as string | undefined;
      if (tabId !== undefined && !tabRejectedAt.has(tabId)) {
        tabRejectedAt.set(tabId, Date.now());
        if (url?.startsWith('http')) tabRejectedUrl.set(tabId, url);
        persist();
        logAction(tabId, 'rejected', tabSite.get(tabId) ?? (url ? registrableDomain(url) : null));
      }
      if (tabId !== undefined && url?.startsWith('http') && !tabCheckingViolation.has(tabId)) {
        tabCheckingViolation.add(tabId);
        void checkViolation(tabId, url);
      }
      return undefined;
    }

    if (msg?.type === 'GET_COOKIES' && typeof msg.url === 'string') {
      try {
        const firstParty: any[] = await cookiesApi.getAll({ url: msg.url });

        const trackerDomains: string[] = [];
        if (typeof msg.tabId === 'number') {
          const tabData = store.getForTab(msg.tabId);
          for (const e of tabData.entities) {
            for (const d of e.domains) trackerDomains.push(d);
          }
        }

        const seen = new Set(firstParty.map((c: any) => `${c.name}|${c.domain}`));
        const unique = [...firstParty];
        for (const domain of trackerDomains) {
          try {
            const tc: any[] = await cookiesApi.getAll({ domain });
            for (const c of tc) {
              const key = `${c.name}|${c.domain}`;
              if (!seen.has(key)) { seen.add(key); unique.push(c); }
            }
          } catch { /* ignore */ }
        }

        return unique;
      } catch {
        return [];
      }
    }

    return undefined;
  });

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      void browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html') });
    }
  });

  void pruneOld();
});
