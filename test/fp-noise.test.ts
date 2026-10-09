import { describe, it, expect } from 'vitest';
import { noisePixels, noiseSamples } from '../lib/fingerprint/noise';

const image = (n: number, alpha = 255): Uint8ClampedArray => {
  const d = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) { d[i * 4] = 100; d[i * 4 + 1] = 150; d[i * 4 + 2] = 200; d[i * 4 + 3] = alpha; }
  return d;
};

describe('noisePixels', () => {
  it('changes a few pixels by at most one step', () => {
    const d = image(1000);
    const before = d.slice();
    noisePixels(d, 12345);
    let changed = 0;
    for (let i = 0; i < d.length; i++) {
      expect(Math.abs(d[i] - before[i])).toBeLessThanOrEqual(1);
      if (d[i] !== before[i]) changed++;
    }
    expect(changed).toBeGreaterThan(20);
    expect(changed).toBeLessThan(400);
  });

  it('is the same every time on one page (same seed), so sites do not break', () => {
    const a = image(500); const b = image(500);
    noisePixels(a, 7); noisePixels(b, 7);
    expect([...a]).toEqual([...b]);
  });

  it('differs between pages (different seeds), so it cannot follow you', () => {
    const a = image(500); const b = image(500);
    noisePixels(a, 7); noisePixels(b, 8);
    expect([...a]).not.toEqual([...b]);
  });

  it('never touches alpha, or fully transparent pixels', () => {
    const d = image(500, 0);
    const before = d.slice();
    noisePixels(d, 99);
    expect([...d]).toEqual([...before]);
    const o = image(500);
    noisePixels(o, 99);
    for (let i = 3; i < o.length; i += 4) expect(o[i]).toBe(255);
  });
});

describe('noiseSamples', () => {
  it('nudges a few audio samples by an inaudible amount, the same way each time', () => {
    const a = new Float32Array(2000).fill(0.25);
    const b = new Float32Array(2000).fill(0.25);
    noiseSamples(a, 3); noiseSamples(b, 3);
    expect([...a]).toEqual([...b]);
    const diffs = [...a].map((v) => Math.abs(v - 0.25)).filter((x) => x > 0);
    expect(diffs.length).toBeGreaterThan(10);
    expect(Math.max(...diffs)).toBeLessThan(1e-6);
  });
});
