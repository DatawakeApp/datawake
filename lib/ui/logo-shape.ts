/** Parse the Datawake logo SVG (design-system/datawake/logo/datawake-logo.svg) into its parts. */

export interface LogoShape {
  viewBox: string;
  d: string;
}

/** Pull the viewBox and path data out of the logo file. */
export function parseLogoSvg(svg: string): LogoShape {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  const d = /<path[^>]*\sd="([^"]+)"/.exec(svg)?.[1];
  if (!viewBox || !d) throw new Error('Logo SVG is missing a viewBox or path');
  return { viewBox, d };
}
