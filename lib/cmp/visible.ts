/**
 * Robust "is this element visible?" for consent banners. NOTE: `offsetParent` is null for
 * position:fixed elements, which is exactly what cookie banners are, so it wrongly reports
 * visible banner buttons as hidden. Use a rect + computed-style check instead.
 */
export function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const s = getComputedStyle(el);
  return (
    s.visibility !== 'hidden' &&
    s.display !== 'none' &&
    s.pointerEvents !== 'none' &&
    parseFloat(s.opacity || '1') > 0.01
  );
}
