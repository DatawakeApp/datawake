/**
 * Render the Datawake logo to the PNG icon sizes the manifest needs: the navy mark, cropped tight,
 * on a white rounded tile. The tile keeps it visible on Chrome's dark toolbar (a transparent
 * navy mark nearly disappears there); the tight crop keeps the face recognisable at 16px.
 * Source: design-system/datawake/logo/datawake-logo.svg
 * Run: npm run build:icons
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { parseLogoSvg } from '../lib/ui/logo-shape';

const LOGO_FILE = path.resolve('design-system/datawake/logo/datawake-logo.svg');
const INK = '#1B2438';
const TILE = '#FFFFFF';
const SIZES = [16, 32, 48, 96, 128];
/** Mark size inside the 128-unit tile: nearly full-bleed so the face reads at 16px. */
const MARK = 124;
const CORNER_RADIUS = 22;
/** The logo file keeps ~6% margin per side (LOGO_MARGIN); icons crop to ~1% (ICON_MARGIN). */
const LOGO_MARGIN = 1.12;
const ICON_MARGIN = 1.02;

/** Same centre, tighter square, so the mark fills the icon tile. */
function tightViewBox(viewBox: string): string {
  const [x, y, side] = viewBox.split(' ').map(Number);
  const tight = (side / LOGO_MARGIN) * ICON_MARGIN;
  const shift = (side - tight) / 2;
  return `${x + shift} ${y + shift} ${tight} ${tight}`;
}

function iconSvg(): string {
  const { viewBox, d } = parseLogoSvg(fs.readFileSync(LOGO_FILE, 'utf8'));
  const offset = (128 - MARK) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="${CORNER_RADIUS}" fill="${TILE}"/>
  <svg x="${offset}" y="${offset}" width="${MARK}" height="${MARK}" viewBox="${tightViewBox(viewBox)}">
    <path fill="${INK}" fill-rule="evenodd" d="${d}"/>
  </svg>
</svg>`;
}

async function main(): Promise<void> {
  const dir = path.resolve('public/icon');
  fs.mkdirSync(dir, { recursive: true });
  const svg = Buffer.from(iconSvg());
  for (const s of SIZES) {
    await sharp(svg, { density: 384 }).resize(s, s).png().toFile(path.join(dir, `${s}.png`));
  }
  console.log(`Wrote ${SIZES.length} icons to ${path.relative(process.cwd(), dir)}: ${SIZES.join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
