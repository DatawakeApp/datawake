/** Font names fingerprinters probe for, as read from canvas fonts and inline element styles. */

const GENERIC_FONTS = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

/** First family of a font-family list, e.g. `'Arial Black', monospace` → `arial black`. */
export function familyFromFontFamily(list: string): string | null {
  const family = list.split(',')[0]?.trim().replace(/^["']|["']$/g, '').toLowerCase();
  return family && !GENERIC_FONTS.has(family) ? family : null;
}

/** First family in a CSS font shorthand, e.g. `72px "Arial Black", monospace` → `arial black`. */
export function familyFromFont(font: string): string | null {
  const m = /(?:\d+(?:\.\d+)?(?:px|pt|em|rem|%)\s*(?:\/\s*\S+\s+)?)(.+)$/.exec(font);
  return familyFromFontFamily(m ? m[1] : font);
}
