/**
 * The Datawake logo (fedora, glasses and scarf) as an inline SVG for the extension UI.
 * Single source of truth: design-system/datawake/logo/datawake-logo.svg, also read by
 * scripts/build-icons.ts for the toolbar/store icons. Fills with `currentColor`.
 */
import logoSvg from '../../design-system/datawake/logo/datawake-logo.svg?raw';
import { parseLogoSvg, type LogoShape } from './logo-shape';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The logo's shape, for drawing it elsewhere (e.g. on the Violation Receipt canvas). */
export const LOGO: LogoShape = parseLogoSvg(logoSvg);

export function brandMark(size: number, cls = 'logo'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', LOGO.viewBox);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  if (cls) svg.setAttribute('class', cls);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', LOGO.d);
  svg.append(path);
  return svg;
}
