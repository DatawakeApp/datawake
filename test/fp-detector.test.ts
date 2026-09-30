import { describe, it, expect, vi } from 'vitest';
import { createFpDetector, FONT_PROBE_THRESHOLD, DEVICE_PROP_THRESHOLD, type FpEvent } from '../lib/fingerprint/detector';

const S = 'https://fp.example/fp.js';

function run(events: FpEvent[]): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  const d = createFpDetector((script, technique) => found.push([script, technique]));
  events.forEach((e) => d.record(e));
  return found;
}

const canvasRead = (over: Partial<Extract<FpEvent, { kind: 'canvas-read' }>> = {}): FpEvent => ({
  kind: 'canvas-read', script: S, width: 240, height: 60, textChars: 26, colors: 2, lossy: false, ...over,
});

describe('canvas fingerprinting (Englehardt & Narayanan 2016 criteria)', () => {
  it('flags a readback of a text-drawn canvas', () => {
    expect(run([canvasRead()])).toEqual([[S, 'canvas']]);
  });

  it.each([
    ['tiny canvas', { width: 10, height: 10 }],
    ['lossy JPEG export (a photo editor, not a fingerprint)', { lossy: true }],
    ['little text in one colour (a chart label)', { textChars: 4, colors: 1 }],
  ])('ignores %s', (_label, over) => {
    expect(run([canvasRead(over)])).toEqual([]);
  });
});

describe('audio fingerprinting', () => {
  it('flags an OfflineAudioContext render with an oscillator', () => {
    expect(run([{ kind: 'audio-render', script: S, oscillator: true }])).toEqual([[S, 'audio']]);
  });

  it('ignores offline rendering without an oscillator (e.g. decoding a sound file)', () => {
    expect(run([{ kind: 'audio-render', script: S, oscillator: false }])).toEqual([]);
  });
});

describe('font fingerprinting', () => {
  const probe = (n: number): FpEvent[] =>
    Array.from({ length: n }, (_, i) => ({ kind: 'font-probe' as const, script: S, family: `Font${i}` }));

  it(`flags measuring ${FONT_PROBE_THRESHOLD}+ distinct font families`, () => {
    expect(run(probe(FONT_PROBE_THRESHOLD))).toEqual([[S, 'fonts']]);
  });

  it('ignores normal text layout (a handful of fonts, repeated)', () => {
    const normal = [...probe(5), ...probe(5), ...probe(5)];
    expect(run(normal)).toEqual([]);
  });
});

describe('weak signals, only claimed in combination', () => {
  const sweep = (n: number): FpEvent[] =>
    Array.from({ length: n }, (_, i) => ({ kind: 'device-prop' as const, script: S, prop: `p${i}` }));

  it('does not claim a WebGL GPU query alone (Google Maps does this legitimately)', () => {
    expect(run([{ kind: 'webgl-unmasked', script: S }])).toEqual([]);
  });

  it('does not claim a device-property sweep alone', () => {
    expect(run(sweep(DEVICE_PROP_THRESHOLD))).toEqual([]);
  });

  it('claims both once the same script does WebGL + a device sweep', () => {
    const found = run([{ kind: 'webgl-unmasked', script: S }, ...sweep(DEVICE_PROP_THRESHOLD)]);
    expect(found.map(([, t]) => t).sort()).toEqual(['device', 'webgl']);
  });

  it('claims a weak signal once the same script has a strong one', () => {
    const found = run([canvasRead(), { kind: 'webgl-unmasked', script: S }]);
    expect(found).toEqual([[S, 'canvas'], [S, 'webgl']]);
  });

  it('does not combine weak signals across different scripts', () => {
    const found = run([
      { kind: 'webgl-unmasked', script: 'https://maps.example/m.js' },
      ...sweep(DEVICE_PROP_THRESHOLD),
    ]);
    expect(found).toEqual([]);
  });
});

describe('reporting', () => {
  it('reports each (script, technique) once', () => {
    const onDetect = vi.fn();
    const d = createFpDetector(onDetect);
    d.record(canvasRead());
    d.record(canvasRead());
    expect(onDetect).toHaveBeenCalledOnce();
  });

  it('tracks scripts independently', () => {
    const other = 'https://other.example/x.js';
    const found = run([canvasRead(), canvasRead({ script: other })]);
    expect(found).toEqual([[S, 'canvas'], [other, 'canvas']]);
  });
});
