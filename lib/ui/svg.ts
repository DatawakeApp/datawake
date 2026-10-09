/** Turn bundled SVG markup into nodes without innerHTML (only ever used for our own static icons). */
const parser = new DOMParser();

export function parseSvg(markup: string): SVGElement | null {
  const doc = parser.parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
  return document.importNode(root, true) as unknown as SVGElement;
}

/** Child elements of an SVG fragment such as `<path d="..."/><circle .../>`. */
export function parseSvgChildren(fragment: string): Node[] {
  const svg = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg">${fragment}</svg>`);
  return svg ? [...svg.childNodes] : [];
}
