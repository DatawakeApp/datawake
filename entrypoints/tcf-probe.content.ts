/**
 * TCF pre-consent vendor count, MAIN-world reader.
 *
 * Runs in the page's MAIN world, so it can read `window.__tcfapi` directly AND is injected by the
 * browser itself, which makes it immune to the page's Content-Security-Policy. (Strict-CSP sites, * news orgs, banks, governments, are exactly where the "N companies already claim the right to
 * track you" number matters most.) The logic lives in lib/tcf/probe.ts; reports are posted to the
 * window, where content.ts relays them to the background and cmp-reject opens its TCF gate.
 */
import { startTcfProbe } from '../lib/tcf/probe';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  // Excluding Firefox keeps the unsupported `world` key out of its manifest.
  main() {
    startTcfProbe({
      getWindow: () => window as unknown as Record<string, unknown>,
      post: ({ count }) => window.postMessage({ __dw: 1, t: 'TCF', n: count }, '*'),
    });
  },
});
