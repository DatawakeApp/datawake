/**
 * Fingerprint protection by noise (the approach Brave uses): add tiny, invisible changes to what
 * canvas and audio readbacks return. The change is the same for the whole page (seeded once per
 * page), so sites that read twice see a stable value, but it differs on every page and every
 * visit, so the result can no longer recognise you across sites.
 */

/** A well-mixed 32-bit hash of the page seed and a position. */
function mix(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** RGBA pixel data: flip the lowest bit of one colour channel in about 1 pixel in 16. */
export function noisePixels(data: Uint8ClampedArray, seed: number): void {
  for (let p = 0, n = data.length >> 2; p < n; p++) {
    const h = mix(seed, p);
    if ((h & 15) !== 0 || data[p * 4 + 3] === 0) continue; // skip fully transparent pixels
    data[p * 4 + ((h >>> 4) % 3)] ^= 1;
  }
}

/** Audio samples: nudge about 1 sample in 16 by far less than anyone can hear. */
export function noiseSamples(data: Float32Array, seed: number): void {
  for (let i = 0; i < data.length; i++) {
    const h = mix(seed, i);
    if ((h & 15) !== 0) continue;
    data[i] += ((h >>> 4) & 1 ? 1 : -1) * 1e-7;
  }
}
