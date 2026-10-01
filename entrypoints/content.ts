import { createBannerGate, createTcfGate, startCmpRejectLoop } from '../lib/cmp/reject';
import { isPayOrOkText, isRejectButtonText } from '../lib/cmp/text';
import { REJECT_SELECTORS, findRejectBySelector } from '../lib/cmp/selectors';
import { detectPayOrOkWall, hasVisibleConsentUi } from '../lib/cmp/pay-or-ok';
import { isVisible } from '../lib/cmp/visible';
import { startTcfProbe } from '../lib/tcf/probe';
import { defineGpcGetter, GPC_ATTR, gpcEnabledFromAttr } from '../lib/gpc/define';

/** Firefox content-script global: makes a content-script function callable from page code. */
declare function exportFunction<T>(fn: T, target: object): T;

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  // Run in sub-frames too: many consent platforms (Consentmanager, Sourcepoint…) render their
  // banner, and its Reject button, inside a cross-origin iframe the top document can't reach.
  // Auto-reject runs in every frame; TCF/relay stay gated to the top frame below.
  allFrames: true,
  // Some CMPs render the banner in an about:srcdoc / about:blank iframe (e.g. Le Figaro).
  matchAboutBlank: true,
  main() {
    const isTopFrame = window.top === window;
    // Known consent-platform reject buttons: lib/cmp/selectors.ts

    // Button-text rules (multilingual, negated accepts, consent-or-pay guard): lib/cmp/text.ts

    function notifyRejected(): void {
      void browser.runtime.sendMessage({ type: 'BANNER_REJECTED' });
    }

    // Consent-or-pay walls ("reject and subscribe"): refusing means paying, so auto-reject must not
    // decide that for the user. We skip, and tell them the site makes them pay to refuse tracking.
    const isPayOrOkWall = (): boolean =>
      detectPayOrOkWall(document, isVisible, { wholeDocIsBanner: !isTopFrame });
    let payOrOkReported = false;
    function reportPayOrOk(): void {
      if (payOrOkReported) return;
      payOrOkReported = true;
      void browser.runtime.sendMessage({ type: 'PAY_OR_OK_WALL' });
    }

    // Some banners (e.g. iubenda) live in an open shadow root, out of reach of document queries.
    const CONSENT_WORDS = /cookie|consent|privacy|tracking|partners|datenschutz|cookies|confidentialit|privacidad/i;
    const MAX_SHADOW_ROOTS = 40;
    /** Open shadow roots, each tagged with the outermost element of its component (its banner). */
    function openShadowRoots(): Array<{ root: ShadowRoot; top: Element }> {
      const found: Array<{ root: ShadowRoot; top: Element }> = [];
      const walk = (root: ParentNode, top: Element | null): void => {
        for (const el of root.querySelectorAll('*')) {
          if (found.length >= MAX_SHADOW_ROOTS) return;
          if (el.shadowRoot) {
            const outer = top ?? el;
            found.push({ root: el.shadowRoot, top: outer });
            walk(el.shadowRoot, outer);
          }
        }
      };
      walk(document, null);
      return found;
    }

    /** Text of a root without its <style>/<script> blocks (banners often start with lots of CSS). */
    function visibleText(root: ParentNode): string {
      let text = '';
      for (const el of Array.from(root.children ?? [])) {
        if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue;
        text += ' ' + (el.textContent ?? '');
        if (text.length > 6000) break;
      }
      return text;
    }

    /** Is this element inside a fixed/sticky bar (how banners sit on screen) that mentions consent? */
    function inConsentBar(el: HTMLElement): boolean {
      let node: HTMLElement | null = el.parentElement;
      for (let depth = 0; node && node !== document.body && depth < 8; depth++, node = node.parentElement) {
        const position = getComputedStyle(node).position;
        if (position === 'fixed' || position === 'sticky') {
          return CONSENT_WORDS.test((node.textContent ?? '').slice(0, 3000));
        }
      }
      return false;
    }

    function findRejectTarget(): HTMLElement | null {
      const shadowEntries = openShadowRoots();
      const shadows = shadowEntries.map((e) => e.root);
      // Known consent-platform buttons first, in the document and any shadow roots.
      for (const root of [document as ParentNode, ...shadows]) {
        const known = findRejectBySelector(root, isVisible);
        if (known && !isPayOrOkText(known.textContent ?? '')) return known;
      }
      // Fallback: text-based on visible buttons in consent-looking containers.
      const containers = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[class*="cookie"], [class*="consent"], [class*="gdpr"], [class*="privacy"], [class*="cmp"], [id*="cookie"], [id*="consent"], [id*="cmp"]',
        ),
      );
      // In a sub-frame (a dedicated CMP iframe like Consentmanager/Sourcepoint), the whole
      // document IS the banner, so scan every button/link, not just named containers. A shadow
      // root counts as a banner only if it talks about consent (not a video player or chat).
      // Judge each component as a whole: the words ("we use cookies") and the buttons can sit in
      // separate nested parts of the same banner (e.g. iubenda's content and footer).
      const componentText = new Map<Element, string>();
      for (const { root, top } of shadowEntries) componentText.set(top, (componentText.get(top) ?? '') + ' ' + visibleText(root));
      const consentShadows = shadowEntries
        .filter(({ top }) => CONSENT_WORDS.test(componentText.get(top) ?? ''))
        .map(({ root }) => root);
      const roots: ParentNode[] = [
        ...(!isTopFrame ? [document] : containers),
        ...consentShadows,
      ];
      const candidates = roots.flatMap((c) =>
        Array.from(c.querySelectorAll<HTMLElement>('button, [role="button"], a')),
      );
      const named = candidates.find((btn) => isRejectButtonText(btn.textContent ?? '') && isVisible(btn));
      if (named) return named;
      // Last resort for banners with scrambled class names (e.g. CookieFirst): a reject button
      // inside a fixed/sticky bar that talks about cookies or consent.
      if (!isTopFrame) return null;
      for (const btn of document.querySelectorAll<HTMLElement>('button, [role="button"], a')) {
        if (!isRejectButtonText(btn.textContent ?? '') || !isVisible(btn)) continue;
        if (inConsentBar(btn)) return btn;
      }
      return null;
    }

    /** True once handled (clicked, or skipped because it's a consent-or-pay wall). */
    function tryAutoReject(): boolean {
      const target = findRejectTarget();
      if (!target) return false;
      if (isPayOrOkWall()) {
        reportPayOrOk();
        return true;
      }
      target.click();
      setTimeout(() => notifyRejected(), 300);
      return true;
    }

    // Walls with no reject button at all (e.g. "Consent" vs "Subscribe") never reach tryAutoReject,
    // so scan for them separately, the popup explains them whether or not auto-reject is on.
    function scanForPayOrOkWall(): void {
      for (const delay of [2000, 5000, 9000]) {
        setTimeout(() => {
          if (!payOrOkReported && isPayOrOkWall()) reportPayOrOk();
        }, delay);
      }
    }
    if (document.readyState !== 'loading') scanForPayOrOkWall();
    else document.addEventListener('DOMContentLoaded', scanForPayOrOkWall, { once: true });

    // Banners can appear late, or be revealed by a class/style change rather than new elements,
    // so react to both kinds of DOM change and also check on a steady interval for a while.
    const AUTO_REJECT_WINDOW_MS = 15_000;
    const AUTO_REJECT_POLL_MS = 800;
    function runAutoReject(): void {
      let done = false;
      let observer: MutationObserver | null = null;
      let poll: ReturnType<typeof setInterval> | undefined;
      const stop = (): void => {
        done = true;
        observer?.disconnect();
        clearInterval(poll);
      };
      // Throttle: busy pages change classes constantly; the interval catches anything skipped.
      let lastAttempt = 0;
      const attempt = (): void => {
        const now = Date.now();
        if (done || now - lastAttempt < 250) return;
        lastAttempt = now;
        if (!tryAutoReject()) return;
        stop();
        // Verify the banner actually closed after a short delay; retry once if still visible.
        setTimeout(() => {
          const stillVisible = REJECT_SELECTORS.some((sel) => {
            const el = document.querySelector<HTMLElement>(sel);
            return el !== null && isVisible(el);
          });
          if (stillVisible) tryAutoReject();
        }, 400);
      };
      const start = (): void => {
        attempt();
        if (done || !document.body) return;
        observer = new MutationObserver(attempt);
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
        });
        poll = setInterval(attempt, AUTO_REJECT_POLL_MS);
        setTimeout(stop, AUTO_REJECT_WINDOW_MS);
      };
      if (document.readyState !== 'loading') start();
      else document.addEventListener('DOMContentLoaded', start, { once: true });
    }

    // TCF vendor count ("N companies claimed the right to track you"). Chrome reads it in the MAIN
    // world (tcf-probe.content.ts) and posts it here; Firefox MV2 has no MAIN world, so it reads it
    // through the Xray waiver. Neither is a page-injected <script>, so both are CSP-immune.
    // The first report also opens the TCF gate that holds Firefox's API auto-reject.
    const pageWindow = (): Record<string, unknown> | undefined =>
      (window as unknown as { wrappedJSObject?: Record<string, unknown> }).wrappedJSObject;
    const tcfGate = createTcfGate(() => typeof pageWindow()?.['__tcfapi'] === 'function');
    function onTcfReport(count: number): void {
      tcfGate.markCaptured();
      // Top frame only, __tcfapi lives on the top window, and we want one count per page.
      if (isTopFrame && count > 0) void browser.runtime.sendMessage({ type: 'TCF_VENDOR_COUNT', count });
    }
    if (import.meta.env.FIREFOX) {
      startTcfProbe({
        getWindow: pageWindow,
        post: (r) => onTcfReport(r.count),
        wrapCallback: (fn) => exportFunction(fn, window),
      });
    } else {
      window.addEventListener('message', (e) => {
        if (e.source !== window || !e.data?.__dw || e.data.t !== 'TCF') return;
        onTcfReport(Number(e.data.n) || 0);
      });
    }

    // CMP native-API auto-reject result (from cmp-reject MAIN world), can arrive in any frame.
    window.addEventListener('message', (e) => {
      if (e.source !== window || !e.data?.__dw) return;
      if (e.data.t === 'REJECTED') notifyRejected();
      if (e.data.t === 'PAY_OR_OK') reportPayOrOk(); // cmp-reject skipped a consent-or-pay wall
      if (e.data.t === 'FP') {
        // Fingerprinting seen by fp-probe (MAIN world); the background validates the fields.
        void browser.runtime.sendMessage({ type: 'FP_DETECTED', script: e.data.script, technique: e.data.technique });
      }
    });

    // GPC JS signal. The getter is defined on the page's navigator synchronously (before page
    // scripts run) and reads a live gate on <html>; we flip the gate once the setting is known.
    // Chrome defines the getter from the MAIN world (gpc.content.ts); Firefox MV2 has no MAIN
    // world, so it's defined here through the Xray waiver.
    function setGpcGate(enabled: boolean): void {
      if (enabled) document.documentElement.removeAttribute(GPC_ATTR);
      else document.documentElement.setAttribute(GPC_ATTR, '0');
    }
    if (import.meta.env.FIREFOX) {
      const page = (window as unknown as { wrappedJSObject?: { navigator?: object } }).wrappedJSObject;
      if (page?.navigator) {
        defineGpcGetter(
          page.navigator,
          () => gpcEnabledFromAttr(document.documentElement.getAttribute(GPC_ATTR)),
          (fn) => exportFunction(fn, window),
        );
      }
    }
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes['settings']) return;
      const s = changes['settings'].newValue as Record<string, unknown> | undefined;
      setGpcGate(s?.['gpcEnabled'] !== false);
    });

    // Check settings before applying GPC and auto-reject.
    // On storage failure, GPC stays on (its default; a harmless opt-out signal); auto-reject does NOT
    // run by default so a user who disabled it doesn't have it re-enabled silently.
    browser.storage.local
      .get('settings')
      .then((stored: Record<string, unknown>) => {
        const s = (stored?.['settings'] as Record<string, unknown> | undefined) ?? {};
        setGpcGate(s['gpcEnabled'] !== false);
        if (s['autoRejectEnabled'] !== false) {
          // Gate for the MAIN-world CMP-API rejecter (it can't read extension storage).
          document.documentElement.setAttribute('data-dw-ar', '1');
          runAutoReject();
          // Firefox has no MAIN world: reach the page's CMP APIs through the Xray waiver instead.
          if (import.meta.env.FIREFOX) {
            // Wait for the banner too, so a consent-or-pay wall can be recognised before rejecting.
            const bannerGate = createBannerGate(() =>
              hasVisibleConsentUi(document, isVisible, { wholeDocIsBanner: !isTopFrame }),
            );
            startCmpRejectLoop({
              getWindow: pageWindow,
              isEnabled: () => true, // already gated by the setting check above
              // Hold the reject until the vendor count is read (rejecting can empty the vendor list).
              isReady: () => tcfGate.isReady() && bannerGate.isReady(),
              shouldSkip: isPayOrOkWall,
              onRejected: notifyRejected,
              onSkipped: reportPayOrOk,
            });
          }
        }
      })
      .catch(() => {
        // Storage unavailable, GPC keeps its default (on); the opt-out signal is low-risk.
        // Do NOT run auto-reject without confirmed user preference.
      });
  },
});
