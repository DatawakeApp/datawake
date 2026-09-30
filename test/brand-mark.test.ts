import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { parseLogoSvg } from '../lib/ui/logo-shape';

const LOGO = fs.readFileSync('design-system/datawake/logo/datawake-logo.svg', 'utf8');

describe('parseLogoSvg', () => {
  it('extracts the square viewBox and path of the official logo', () => {
    const logo = parseLogoSvg(LOGO);
    const [, , w, h] = logo.viewBox.split(' ').map(Number);
    expect(w).toBeGreaterThan(0);
    expect(w).toBe(h); // square, so it fits icon tiles without distortion
    expect(logo.d.length).toBeGreaterThan(100);
  });

  it('throws a clear error for a file without a viewBox or path', () => {
    expect(() => parseLogoSvg('<svg></svg>')).toThrow(/logo svg/i);
  });
});
