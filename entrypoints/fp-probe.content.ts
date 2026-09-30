/**
 * Fingerprinting detection, MAIN world (Chrome MV3).
 *
 * Instruments fingerprinting APIs on the page's own window (lib/fingerprint/instrument.ts), feeds
 * the observations to the conservative detector (lib/fingerprint/detector.ts), and posts each
 * (script, technique) finding to the window, where content.ts relays it to the background.
 *
 * Runs at document_start in every frame (fingerprinters often run inside ad iframes), before page
 * scripts. Observe-only: it never changes what the APIs return.
 *
 * Chrome-only for now: Firefox MV2 has no MAIN world.
 */
import { createFpDetector } from '../lib/fingerprint/detector';
import { installFpProbes, watchSameOriginFrames } from '../lib/fingerprint/instrument';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  exclude: ['firefox'],
  allFrames: true,
  matchAboutBlank: true,
  main() {
    const detector = createFpDetector((script, technique) =>
      window.postMessage({ __dw: 1, t: 'FP', script, technique, at: Date.now() }, '*'),
    );
    // Instrument this window, and any same-origin iframe the page reaches into (before it can use
    // the fresh frame's APIs). Each realm is instrumented once; cross-origin access throws → skipped.
    const instrumented = new WeakSet<object>();
    const instrument = (w: Window & typeof globalThis): void => {
      if (instrumented.has(w)) return;
      try {
        void w.CanvasRenderingContext2D; // throws for cross-origin windows
        instrumented.add(w);
        installFpProbes(w, (event) => detector.record(event));
        watchSameOriginFrames(w, instrument);
      } catch {
        // cross-origin, its own content-script instance covers it
      }
    };
    instrument(window);
  },
});
