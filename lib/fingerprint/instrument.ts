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
 * probing, DOM font probing (measuring elements styled with one font each), WebGL unmasked
 * vendor/renderer, high-entropy navigator/screen properties. Not covered: OffscreenCanvas in workers.
 */
import { callerScript } from './stack';
import type { FpEvent } from './detector';
import { familyFromFont, familyFromFontFamily } from './font-family';
import { noisePixels, noiseSamples } from './noise';

/** Fingerprint protection: when `protect()` is true, canvas and audio readbacks get page-stable noise. */
export interface ProtectOptions {
  protect: () => boolean;
  seed: number;
}

const NO_PROTECTION: ProtectOptions = { protect: () => false, seed: 0 };

const UNMASKED_VENDOR_WEBGL = 0x9245;
const UNMASKED_RENDERER_WEBGL = 0x9246;
/** Stop recording device-property reads after this many (bounds overhead on busy pages). */
const MAX_DEVICE_READS = 2000;
const MAX_TRACKED_CHARS = 64;
/** Stop noting new font families after this many (bounds overhead on font-heavy pages). */
const MAX_FONT_FAMILIES = 500;

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

/** Like wrapMethod, but `impl` produces the result (it may call the original via `call`). */
function wrapResult(
  obj: object | undefined,
  name: string,
  impl: (call: () => unknown, self: unknown, args: unknown[]) => unknown,
): void {
  if (!obj) return;
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  if (!desc || typeof desc.value !== 'function') return;
  const proxy = new Proxy(desc.value as AnyFn, {
    apply(target, self, args) {
      const call = (): unknown => Reflect.apply(target, self, args);
      try {
        return impl(call, self, args);
      } catch {
        // Our change failed (or the original threw, e.g. a cross-origin canvas): behave exactly
        // like the original, including throwing its own error.
        return call();
      }
    },
  });
  Object.defineProperty(obj, name, { ...desc, value: proxy });
}

function wrapGetter(obj: object | undefined, name: string, before: (self: unknown) => void): void {
  if (!obj) return;
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  if (!desc || typeof desc.get !== 'function') return;
  const proxy = new Proxy(desc.get, {
    apply(target, self, args) {
      try {
        before(self);
      } catch {
        // never break the page
      }
      return Reflect.apply(target, self, args);
    },
  });
  Object.defineProperty(obj, name, { ...desc, get: proxy });
}

export function installFpProbes(
  w: Window & typeof globalThis,
  report: (e: FpEvent) => void,
  { protect, seed }: ProtectOptions = NO_PROTECTION,
): void {
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
  // The originals, so exporting the noisy copy never runs back through our own wrappers.
  const TO_DATA_URL = CANVAS?.toDataURL;
  const TO_BLOB = CANVAS?.toBlob;
  const C2D_GET = C2D?.getImageData;
  const C2D_PUT = C2D?.putImageData;
  const C2D_DRAW = C2D?.drawImage;

  /** A copy of the canvas with noise added, for toDataURL/toBlob to export instead of the original. */
  const noisyCopy = (el: HTMLCanvasElement): HTMLCanvasElement | null => {
    if (!el.width || !el.height || !C2D_GET || !C2D_PUT || !C2D_DRAW) return null;
    const copy = w.document.createElement('canvas');
    copy.width = el.width;
    copy.height = el.height;
    const ctx = copy.getContext('2d');
    if (!ctx) return null;
    (C2D_DRAW as AnyFn).call(ctx, el, 0, 0);
    const img = (C2D_GET as AnyFn).call(ctx, 0, 0, el.width, el.height) as ImageData;
    noisePixels(img.data, seed);
    (C2D_PUT as AnyFn).call(ctx, img, 0, 0);
    return copy;
  };

  wrapResult(CANVAS, 'toDataURL', (call, c, args) => {
    const el = c as HTMLCanvasElement;
    try { readback(el, el.width, el.height, args[0]); } catch { /* bookkeeping only */ }
    if (!protect()) return call();
    const copy = noisyCopy(el);
    return copy && TO_DATA_URL ? Reflect.apply(TO_DATA_URL, copy, args) : call();
  });
  wrapResult(CANVAS, 'toBlob', (call, c, args) => {
    const el = c as HTMLCanvasElement;
    try { readback(el, el.width, el.height, args[1]); } catch { /* bookkeeping only */ }
    if (!protect()) return call();
    const copy = noisyCopy(el);
    return copy && TO_BLOB ? Reflect.apply(TO_BLOB, copy, args) : call();
  });
  wrapResult(C2D, 'getImageData', (call, ctx, args) => {
    const [, , sw, sh] = args;
    try {
      readback((ctx as CanvasRenderingContext2D).canvas, Math.abs(Number(sw)), Math.abs(Number(sh)), undefined);
    } catch { /* bookkeeping only */ }
    const img = call() as ImageData;
    if (protect() && img?.data) noisePixels(img.data, seed);
    return img;
  });

  // ── Fonts: distinct families measured via canvas or FontFaceSet.check ───────────────────────
  const seenFamilies = new Set<string>();
  const noteFamily = (family: string | null): void => {
    if (!family || seenFamilies.has(family) || seenFamilies.size >= MAX_FONT_FAMILIES) return;
    seenFamilies.add(family);
    const s = script();
    if (s) report({ kind: 'font-probe', script: s, family });
  };
  wrapMethod(C2D, 'measureText', (ctx) => noteFamily(familyFromFont(String((ctx as CanvasRenderingContext2D).font))));
  wrapMethod(w.FontFaceSet?.prototype, 'check', (_self, [font]) => noteFamily(familyFromFont(String(font))));

  // DOM probing: style an element with one font (falling back to a generic one) and measure it; a
  // changed size means the font is installed. Layout reads are hot, so only an element with an
  // inline font-family is looked at, and a stack is taken only for a family not seen before.
  let lastInline = '';
  const onMeasure = (el: unknown): void => {
    const inline = (el as HTMLElement).style?.fontFamily;
    if (!inline || inline === lastInline) return; // layout code re-measures the same element a lot
    lastInline = inline;
    noteFamily(familyFromFontFamily(inline));
  };
  const EL = w.HTMLElement?.prototype;
  wrapGetter(EL, 'offsetWidth', onMeasure);
  wrapGetter(EL, 'offsetHeight', onMeasure);

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
  // Rendered offline audio (the classic audio fingerprint): note it, and mark the buffer for noise.
  const rendered = new WeakSet<object>();
  const noised = new WeakSet<object>();
  wrapResult(w.OfflineAudioContext?.prototype, 'startRendering', (call, ctx) => {
    try {
      const s = script();
      if (s) report({ kind: 'audio-render', script: s, oscillator: withOscillator.has(ctx as object) });
    } catch { /* bookkeeping only */ }
    const result = call();
    if (protect() && result && typeof (result as Promise<unknown>).then === 'function') {
      // Attached first, so the buffer is marked before the page's own handler sees it.
      void (result as Promise<unknown>).then((buf) => { if (buf) rendered.add(buf as object); }, () => undefined);
    }
    return result;
  });
  wrapResult(w.AudioBuffer?.prototype, 'getChannelData', (call, buf) => {
    const data = call() as Float32Array;
    if (protect() && rendered.has(buf as object) && data && !noised.has(data)) {
      noised.add(data);
      noiseSamples(data, seed);
    }
    return data;
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
