/**
 * Fingerprinting detector, turns observed browser-API calls into "script S used technique T".
 *
 * Pure and incremental: the MAIN-world probe (entrypoints/fp-probe.content.ts) feeds it events as
 * they happen, and it reports each (script, technique) pair once. Thresholds are deliberately
 * conservative, a false "this site is fingerprinting you" is a false claim about a site:
 *
 *  Strong (claimed on their own):
 *   - canvas: readback of a ≥16×16 canvas, not lossy JPEG, holding ≥10 distinct text characters
 *     or ≥2 colours (Englehardt & Narayanan, "Online Tracking: A 1-million-site Measurement", 2016)
 *   - audio: OfflineAudioContext render driven by an oscillator (the classic audio fingerprint)
 *   - fonts: ≥FONT_PROBE_THRESHOLD distinct font families measured (installed-font probing)
 *  Weak (claimed only alongside another signal from the SAME script):
 *   - webgl: reading the unmasked GPU vendor/renderer (also done legitimately, e.g. map renderers)
 *   - device: reading ≥DEVICE_PROP_THRESHOLD distinct high-entropy navigator/screen properties
 */

export type FpTechnique = 'canvas' | 'audio' | 'fonts' | 'webgl' | 'device';

export type FpEvent =
  | {
      kind: 'canvas-read';
      script: string;
      width: number;
      height: number;
      /** Distinct characters drawn with fillText/strokeText on this canvas. */
      textChars: number;
      /** Distinct fill/stroke styles used for that text. */
      colors: number;
      /** Exported as lossy JPEG/WebP (photo export, not a fingerprint). */
      lossy: boolean;
    }
  | { kind: 'audio-render'; script: string; oscillator: boolean }
  | { kind: 'font-probe'; script: string; family: string }
  | { kind: 'webgl-unmasked'; script: string }
  | { kind: 'device-prop'; script: string; prop: string };

export const MIN_CANVAS_SIDE = 16;
export const MIN_CANVAS_TEXT_CHARS = 10;
export const MIN_CANVAS_COLORS = 2;
export const FONT_PROBE_THRESHOLD = 50;
export const DEVICE_PROP_THRESHOLD = 10;

const STRONG: ReadonlySet<FpTechnique> = new Set(['canvas', 'audio', 'fonts']);

interface ScriptState {
  strong: Set<FpTechnique>;
  weak: Set<FpTechnique>;
  reported: Set<FpTechnique>;
  fonts: Set<string>;
  props: Set<string>;
}

export interface FpDetector {
  record(event: FpEvent): void;
}

export function createFpDetector(onDetect: (script: string, technique: FpTechnique) => void): FpDetector {
  const scripts = new Map<string, ScriptState>();

  const stateFor = (script: string): ScriptState => {
    let s = scripts.get(script);
    if (!s) {
      s = { strong: new Set(), weak: new Set(), reported: new Set(), fonts: new Set(), props: new Set() };
      scripts.set(script, s);
    }
    return s;
  };

  const report = (script: string, s: ScriptState, technique: FpTechnique): void => {
    if (s.reported.has(technique)) return;
    s.reported.add(technique);
    onDetect(script, technique);
  };

  const signal = (script: string, technique: FpTechnique): void => {
    const s = stateFor(script);
    if (STRONG.has(technique)) {
      s.strong.add(technique);
      report(script, s, technique);
    } else {
      s.weak.add(technique);
    }
    // Weak signals become claims once the script has a strong one, or two different weak ones.
    if (s.strong.size > 0 || s.weak.size >= 2) s.weak.forEach((t) => report(script, s, t));
  };

  const isCanvasFingerprint = (e: Extract<FpEvent, { kind: 'canvas-read' }>): boolean =>
    e.width >= MIN_CANVAS_SIDE &&
    e.height >= MIN_CANVAS_SIDE &&
    !e.lossy &&
    (e.textChars >= MIN_CANVAS_TEXT_CHARS || e.colors >= MIN_CANVAS_COLORS);

  return {
    record(e) {
      switch (e.kind) {
        case 'canvas-read':
          if (isCanvasFingerprint(e)) signal(e.script, 'canvas');
          return;
        case 'audio-render':
          if (e.oscillator) signal(e.script, 'audio');
          return;
        case 'font-probe': {
          const s = stateFor(e.script);
          s.fonts.add(e.family.toLowerCase());
          if (s.fonts.size >= FONT_PROBE_THRESHOLD) signal(e.script, 'fonts');
          return;
        }
        case 'webgl-unmasked':
          signal(e.script, 'webgl');
          return;
        case 'device-prop': {
          const s = stateFor(e.script);
          s.props.add(e.prop);
          if (s.props.size >= DEVICE_PROP_THRESHOLD) signal(e.script, 'device');
          return;
        }
      }
    },
  };
}
