/**
 * Fingerprinting detection, MAIN world.
 *
 * Instruments fingerprinting APIs on the page's own window (lib/fingerprint/instrument.ts), feeds
 * the observations to the conservative detector (lib/fingerprint/detector.ts), and posts each
 * (script, technique) finding to the window, where content.ts relays it to the background.
 *
 * Runs at document_start in every frame (fingerprinters often run inside ad iframes), before page
 * scripts. Observe-only unless fingerprint protection is on in Settings, which adds page-stable
 * noise to canvas and audio readbacks.
 */
import { createFpDetector } from '../lib/fingerprint/detector';
import { installFpProbes, watchSameOriginFrames } from '../lib/fingerprint/instrument';
import { PROTECT_EVENT, PROTECT_FLAG } from '../lib/fingerprint/protect-signal';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: true,
  matchAboutBlank: true,
  main() {
    // Fingerprint protection (Settings): switched on by fp-protect.content.ts, see protect-signal.ts.
    let protecting = false;
    const page = window as unknown as Record<string, unknown>;
    if (page[PROTECT_FLAG] === true) {
      protecting = true;
      delete page[PROTECT_FLAG];
    }
    document.addEventListener(PROTECT_EVENT, (e) => {
      protecting = true;
      e.preventDefault();
    });
    // One random seed per page: the noise is stable on this page but differs on every other one.
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const protection = { protect: () => protecting, seed };

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
        installFpProbes(w, (event) => detector.record(event), protection);
        watchSameOriginFrames(w, instrument);
      } catch {
        // cross-origin, its own content-script instance covers it
      }
    };
    instrument(window);
  },
});
