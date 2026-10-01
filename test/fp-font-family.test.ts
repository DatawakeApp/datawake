import { describe, it, expect } from 'vitest';
import { familyFromFont, familyFromFontFamily } from '../lib/fingerprint/font-family';

describe('familyFromFontFamily (inline style.fontFamily)', () => {
  it('takes the first family, unquoted and lowercased', () => {
    expect(familyFromFontFamily("'Arial Black', monospace")).toBe('arial black');
    expect(familyFromFontFamily('"Segoe UI",sans-serif')).toBe('segoe ui');
    expect(familyFromFontFamily('Helvetica')).toBe('helvetica');
  });

  it('ignores generic families and empty values', () => {
    expect(familyFromFontFamily('monospace')).toBeNull();
    expect(familyFromFontFamily('sans-serif')).toBeNull();
    expect(familyFromFontFamily('')).toBeNull();
    expect(familyFromFontFamily('   ')).toBeNull();
  });
});

describe('familyFromFont (canvas font shorthand)', () => {
  it('reads the family after the size', () => {
    expect(familyFromFont('72px "Arial Black", monospace')).toBe('arial black');
    expect(familyFromFont('bold 12px/1.5 Verdana')).toBe('verdana');
  });

  it('ignores generic families', () => {
    expect(familyFromFont('10px sans-serif')).toBeNull();
  });
});
