/**
 * CMP auto-reject via native JavaScript APIs, MAIN world (Chrome MV3).
 *
 * The reject logic lives in lib/cmp/reject.ts; this entrypoint just runs it on the page window.
 *
 * Gating: MAIN world can't read extension storage, so the isolated content script sets
 * `document.documentElement[data-dw-ar="1"]` when the user's auto-reject setting is on; we wait for
 * that before rejecting, so a user who disabled auto-reject is respected. On success we postMessage
 * so the isolated content script fires BANNER_REJECTED (→ violation check).
 *
 * Chrome-only: Firefox MV2 has no MAIN world, so content.ts runs the same loop through
 * `window.wrappedJSObject` instead.
 */
import { createBannerGate, createTcfGate, startCmpRejectLoop } from '../lib/cmp/reject';
import { detectPayOrOkWall, hasVisibleConsentUi } from '../lib/cmp/pay-or-ok';
import { isVisible } from '../lib/cmp/visible';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  exclude: ['firefox'],
  allFrames: true,
  // Some CMPs render the banner in an about:srcdoc / about:blank iframe (e.g. Le Figaro).
  matchAboutBlank: true,
  main() {
    // Don't reject before tcf-probe has read the vendor count (rejecting empties the vendor list).
    const tcfGate = createTcfGate(
      () => typeof (window as unknown as { __tcfapi?: unknown }).__tcfapi === 'function',
    );
    window.addEventListener('message', (e) => {
      if (e.source === window && e.data?.__dw && e.data.t === 'TCF') tcfGate.markCaptured();
    });

    const inSubFrame = window.top !== window;
    // ...and not before the banner renders, so a consent-or-pay wall can be recognised first.
    const bannerGate = createBannerGate(() =>
      hasVisibleConsentUi(document, isVisible, { wholeDocIsBanner: inSubFrame }),
    );

    startCmpRejectLoop({
      getWindow: () => window as unknown as Record<string, unknown>,
      isEnabled: () => document.documentElement.getAttribute('data-dw-ar') === '1',
      isReady: () => tcfGate.isReady() && bannerGate.isReady(),
      // Consent-or-pay wall: rejecting would land the user on a paywall, skip, and let content.ts
      // tell them.
      shouldSkip: () => detectPayOrOkWall(document, isVisible, { wholeDocIsBanner: inSubFrame }),
      onRejected: (cmp) => window.postMessage({ __dw: 1, t: 'REJECTED', cmp }, '*'),
      onSkipped: (cmp) => window.postMessage({ __dw: 1, t: 'PAY_OR_OK', cmp }, '*'),
    });
  },
});
