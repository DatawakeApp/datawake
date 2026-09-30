/**
 * MAIN-world instrumentation of the browser APIs fingerprinters use. Observe-only: every wrapper
 * calls the original with the same `this`/arguments and returns its result untouched; our
 * bookkeeping is try/caught so it can never break a page.
 *
 * Wrappers are Proxies around the native functions, so `name`, `length` and
 * `Function.prototype.toString` (→ "[native code]") are preserved, fingerprinting scripts that
 * check for tampering see the originals.
 *
 * Coverage (v1, Chrome): canvas 2D text + readback, OfflineAudioContext, canvas/FontFaceSet font
 * probing, WebGL unmasked vendor/renderer, high-entropy navigator/screen properties. Not covered:
 * Workers/OffscreenCanvas in workers, DOM-based (span width) font probing.
 */
import { callerScript } from './stack';
import type { FpEvent } from './detector';

const UNMASKED_VENDOR_WEBGL = 0x9245;
const UNMASKED_RENDERER_WEBGL = 0x9246;
const GENERIC_FONTS = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
/** Stop recording device-property reads after this many (bounds overhead on busy pages). */
const MAX_DEVICE_READS = 2000;
const MAX_TRACKED_CHARS = 64;

type AnyFn = (...args: unknown[]) => unknown;

function wrapMethod(obj: object | undefined, name: string, before: (self: unknown, args: unknown[]) => void): void {
  if (!obj) return;
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  if (!desc || typeof desc.value !== 'function') return;
  const proxy = new Proxy(desc.value as AnyFn, {
    apply(target, self, args) {
      try {
        before(self, args);
      } catch {
        // bookkeeping must never break the page
      }
      return Reflect.apply(target, self, args);
    },
  });
  Object.defineProperty(obj, name, { ...desc, value: proxy });
}

function wrapGetter(obj: object | undefined, name: string, before: () => void): void {
  if (!obj) return;
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  if (!desc || typeof desc.get !== 'function') return;
  const proxy = new Proxy(desc.get, {
    apply(target, self, args) {
      try {
        before();
      } catch {
        // never break the page
      }
      return Reflect.apply(target, self, args);
    },
  });
  Object.defineProperty(obj, name, { ...desc, get: proxy });
}

/** First family in a CSS font shorthand, e.g. `72px "Arial Black", monospace` → `arial black`. */
function firstFamily(font: string): string | null {
  const m = /(?:\d+(?:\.\d+)?(?:px|pt|em|rem|%)\s*(?:\/\s*\S+\s+)?)(.+)$/.exec(font);
  const family = (m ? m[1] : font).split(',')[0]?.trim().replace(/^["']|["']$/g, '').toLowerCase();
  return family && !GENERIC_FONTS.has(family) ? family : null;
}

export function installFpProbes(w: Window & typeof globalThis, report: (e: FpEvent) => void): void {
  const script = (): string | null => callerScript(new Error().stack);

  // ── Canvas: remember what text was drawn on each canvas; judge it at readback ──────────────
  const drawn = new WeakMap<object, { chars: Set<string>; colors: Set<string> }>();
  const noteText = (ctx: unknown, text: unknown, style: unknown): void => {
    const canvas = (ctx as CanvasRenderingContext2D)?.canvas;
    if (!canvas) return;
    let st = drawn.get(canvas);
    if (!st) drawn.set(canvas, (st = { chars: new Set(), colors: new Set() }));
    for (const ch of String(text)) {
      if (st.chars.size >= MAX_TRACKED_CHARS) break;
      st.chars.add(ch);
    }
    st.colors.add(String(style));
  };
  const C2D = w.CanvasRenderingContext2D?.prototype;
  wrapMethod(C2D, 'fillText', (ctx, [text]) => noteText(ctx, text, (ctx as CanvasRenderingContext2D).fillStyle));
  wrapMethod(C2D, 'strokeText', (ctx, [text]) => noteText(ctx, text, (ctx as CanvasRenderingContext2D).strokeStyle));

  const readback = (canvas: unknown, width: number, height: number, type: unknown): void => {
    const st = canvas ? drawn.get(canvas as object) : undefined;
    if (!st || st.chars.size === 0) return; // no text drawn → not a text-canvas fingerprint
    const s = script();
    if (!s) return;
    const lossy = typeof type === 'string' && /jpe?g|webp/i.test(type);
    report({ kind: 'canvas-read', script: s, width, height, textChars: st.chars.size, colors: st.colors.size, lossy });
  };
  const CANVAS = w.HTMLCanvasElement?.prototype;
  wrapMethod(CANVAS, 'toDataURL', (c, [type]) => {
    const el = c as HTMLCanvasElement;
    readback(el, el.width, el.height, type);
  });
  wrapMethod(CANVAS, 'toBlob', (c, [, type]) => {
    const el = c as HTMLCanvasElement;
    readback(el, el.width, el.height, type);
  });
  wrapMethod(C2D, 'getImageData', (ctx, [, sw, sh]) =>
    readback((ctx as CanvasRenderingContext2D).canvas, Math.abs(Number(sw)), Math.abs(Number(sh)), undefined),
  );

  // ── Fonts: distinct families measured via canvas or FontFaceSet.check ───────────────────────
  const seenFamilies = new Set<string>();
  const noteFont = (font: unknown): void => {
    const family = firstFamily(String(font));
    if (!family || seenFamilies.has(family)) return;
    seenFamilies.add(family);
    const s = script();
    if (s) report({ kind: 'font-probe', script: s, family });
  };
  wrapMethod(C2D, 'measureText', (ctx) => noteFont((ctx as CanvasRenderingContext2D).font));
  wrapMethod(w.FontFaceSet?.prototype, 'check', (_self, [font]) => noteFont(font));

  // ── WebGL: unmasked GPU vendor / renderer ───────────────────────────────────────────────────
  const onGetParameter = (_self: unknown, [pname]: unknown[]): void => {
    if (pname !== UNMASKED_VENDOR_WEBGL && pname !== UNMASKED_RENDERER_WEBGL) return;
    const s = script();
    if (s) report({ kind: 'webgl-unmasked', script: s });
  };
  wrapMethod(w.WebGLRenderingContext?.prototype, 'getParameter', onGetParameter);
  wrapMethod(w.WebGL2RenderingContext?.prototype, 'getParameter', onGetParameter);

  // ── Audio: an OfflineAudioContext that renders an oscillator ────────────────────────────────
  const withOscillator = new WeakSet<object>();
  wrapMethod(w.BaseAudioContext?.prototype, 'createOscillator', (ctx) => {
    if (w.OfflineAudioContext && ctx instanceof w.OfflineAudioContext) withOscillator.add(ctx as object);
  });
  wrapMethod(w.OfflineAudioContext?.prototype, 'startRendering', (ctx) => {
    const s = script();
    if (s) report({ kind: 'audio-render', script: s, oscillator: withOscillator.has(ctx as object) });
  });

  // ── Device: high-entropy navigator / screen properties ──────────────────────────────────────
  let deviceReads = 0;
  const noteProp = (prop: string) => (): void => {
    if (++deviceReads > MAX_DEVICE_READS) return;
    const s = script();
    if (s) report({ kind: 'device-prop', script: s, prop });
  };
  const NAV = w.Navigator?.prototype;
  for (const p of [
    'hardwareConcurrency', 'deviceMemory', 'platform', 'languages', 'plugins', 'mimeTypes',
    'maxTouchPoints', 'vendor', 'doNotTrack', 'pdfViewerEnabled', 'connection',
  ]) wrapGetter(NAV, p, noteProp(`navigator.${p}`));
  const SCREEN = w.Screen?.prototype;
  for (const p of ['colorDepth', 'pixelDepth', 'availWidth', 'availHeight', 'width', 'height']) {
    wrapGetter(SCREEN, p, noteProp(`screen.${p}`));
  }
  wrapMethod(
    (w as unknown as { NavigatorUAData?: { prototype: object } }).NavigatorUAData?.prototype,
    'getHighEntropyValues',
    noteProp('navigator.userAgentData.highEntropy'),
  );
}

/**
 * Call `onFrame` with a same-origin iframe's window the first time page code reaches into it via
 * `contentWindow` / `contentDocument`, synchronously, before the page gets it back. Defeats the
 * "fingerprint through a fresh about:blank iframe" evasion (seen on browserleaks.com), which can
 * otherwise use the new frame's un-instrumented APIs before our content script is injected there.
 */
export function watchSameOriginFrames(w: Window & typeof globalThis, onFrame: (child: Window & typeof globalThis) => void): void {
  const IFRAME = w.HTMLIFrameElement?.prototype;
  const wrapResult = (name: 'contentWindow' | 'contentDocument', toWindow: (r: unknown) => unknown): void => {
    const desc = IFRAME && Object.getOwnPropertyDescriptor(IFRAME, name);
    if (!desc || typeof desc.get !== 'function') return;
    const proxy = new Proxy(desc.get, {
      apply(target, self, args) {
        const result = Reflect.apply(target, self, args);
        try {
          const child = toWindow(result);
          if (child) onFrame(child as Window & typeof globalThis);
        } catch {
          // cross-origin frame, can't (and needn't) instrument from here
        }
        return result;
      },
    });
    Object.defineProperty(IFRAME, name, { ...desc, get: proxy });
  };
  wrapResult('contentWindow', (r) => r);
  wrapResult('contentDocument', (r) => (r as Document | null)?.defaultView);
}
