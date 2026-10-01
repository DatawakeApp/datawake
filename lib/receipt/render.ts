import type { ReceiptData } from './model';
import { SITE_URL } from './caption';
import { LOGO } from '../ui/brand-mark';

/**
 * Renders a "Violation Receipt", a shareable PNG that anyone understands at a glance:
 * a paper thermal receipt reading CAUGHT, on a dark card, sized square (1080×1080)
 * so it drops cleanly into X / Instagram / TikTok / Reddit.
 *
 * Pure Canvas 2D, zero dependencies, matching the project's no-runtime-deps rule.
 */

// ── Palette ──────────────────────────────────────────────────────────────────
const BG = '#0b0e14'; // app dark
const BG_EDGE = '#141a26'; // subtle vignette toward center
const PAPER = '#f7f4ee'; // off-white receipt stock
const PAPER_SHADOW = 'rgba(0,0,0,0.45)';
const INK = '#1a1a1a'; // receipt text
const INK_SOFT = '#6b6b6b'; // faded receipt text
const RED = '#e5484d'; // the CAUGHT stamp / alert red
const RULE = '#d9d4c8'; // dotted divider on paper

export const RECEIPT_SIZE = 1080;

/** A monospace stack that resolves on macOS/Windows/Linux so the "receipt" look holds. */
const MONO = "'SF Mono', 'Menlo', 'Consolas', 'Roboto Mono', 'Courier New', monospace";
const SANS = "'Helvetica Neue', Arial, system-ui, sans-serif";

/** Draw the receipt onto a provided 2D context (size RECEIPT_SIZE²). Exposed for testing/preview. */
export function drawReceipt(ctx: CanvasRenderingContext2D, data: ReceiptData): void {
  const S = RECEIPT_SIZE;
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Background with a soft radial vignette.
  const grad = ctx.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S * 0.75);
  grad.addColorStop(0, BG_EDGE);
  grad.addColorStop(1, BG);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Paper geometry, a tall receipt centered with a small dark margin all around.
  const paperW = 720;
  const paperX = (S - paperW) / 2;
  const paperTop = 60;
  const paperBottom = S - 60; // torn edge sits here; footer line prints just above it

  drawPaper(ctx, paperX, paperTop, paperW, paperBottom - paperTop);

  const cx = S / 2;
  const padX = paperX + 56;
  const rightX = paperX + paperW - 56;
  const contentW = paperW - 112;
  let y = paperTop + 78;

  // ── Merchant header ──
  ctx.textAlign = 'center';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 24px ${MONO}`;
  ctx.fillText('* * *  D A T A W A K E  * * *', cx, y);
  y += 36;
  ctx.font = `400 20px ${MONO}`;
  ctx.fillText('CONSUMER PROTECTION RECEIPT', cx, y);
  y += 44;

  dottedRule(ctx, padX, rightX, y);
  y += 58;

  // ── The verdict stamp ──
  drawStamp(ctx, cx, y, 'CAUGHT');
  y += 92;

  // ── The site + the accusation ──
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  y = drawWrapped(ctx, data.site, cx, y, contentW, `700 52px ${SANS}`, 56);
  y += 8;
  ctx.fillStyle = INK;
  y = drawWrapped(ctx, 'tracked you AFTER you clicked', cx, y, contentW, `400 30px ${SANS}`, 38);
  ctx.fillStyle = RED;
  ctx.font = `800 44px ${SANS}`;
  ctx.fillText('"REJECT"', cx, y + 4);
  y += 58;

  dottedRule(ctx, padX, rightX, y);
  y += 50;

  // ── Itemized "receipt" lines ──
  ctx.font = `400 26px ${MONO}`;
  if (data.cookieCount > 0) y = lineItem(ctx, padX, rightX, y, 'TRACKING COOKIES', String(data.cookieCount));
  if (data.fingerprintCount > 0) y = lineItem(ctx, padX, rightX, y, 'DEVICE FINGERPRINTING', String(data.fingerprintCount));
  y = lineItem(ctx, padX, rightX, y, 'COMPANIES', String(data.companyCount));
  y += 4;

  // Company list, monospace, indented like receipt sub-items.
  ctx.textAlign = 'left';
  ctx.font = `400 24px ${MONO}`;
  ctx.fillStyle = INK_SOFT;
  for (const name of data.companies) {
    ctx.fillText(truncate(ctx, `- ${name}`, contentW), padX, y);
    y += 32;
  }
  if (data.moreCompanies > 0) {
    ctx.fillText(`+ ${data.moreCompanies} more`, padX, y);
    y += 32;
  }
  y += 8;

  dottedRule(ctx, padX, rightX, y);
  y += 42;

  // ── Timestamp + legal line ──
  ctx.textAlign = 'left';
  ctx.font = `400 24px ${MONO}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText(`${data.dateLabel}`, padX, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${data.timeLabel}`, rightX, y);
  y += 40;

  ctx.textAlign = 'center';
  ctx.fillStyle = RED;
  ctx.font = `700 26px ${MONO}`;
  ctx.fillText('!! MAY BE ILLEGAL UNDER GDPR !!', cx, y);
  y += 42;

  dottedRule(ctx, padX, rightX, y);
  y += 38;

  // ── Footer CTA, printed on the receipt itself ──
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 30px ${SANS}`;
  ctx.fillText('Catch who ignores your Reject', cx, y);
  y += 38;
  ctx.fillStyle = RED;
  ctx.font = `800 34px ${MONO}`;
  ctx.fillText(SITE_URL, cx, y);
  // The Datawake mark, printed in receipt ink just left of the URL.
  const urlWidth = ctx.measureText(SITE_URL).width;
  drawLogo(ctx, cx - urlWidth / 2 - LOGO_SIZE - 14, y - LOGO_SIZE + 6, LOGO_SIZE, INK);

  ctx.restore();
}

const LOGO_SIZE = 44;

/** Draw the logo (its own viewBox scaled into a size×size square at x, y). */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const [vx, vy, side] = LOGO.viewBox.split(' ').map(Number);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / side, size / side);
  ctx.translate(-vx, -vy);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(LOGO.d), 'evenodd');
  ctx.restore();
}

/** Render the receipt to a PNG Blob using an in-memory canvas. Requires a DOM (popup/dashboard). */
export async function renderReceiptBlob(data: ReceiptData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = RECEIPT_SIZE;
  canvas.height = RECEIPT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  drawReceipt(ctx, data);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode receipt PNG'));
    }, 'image/png');
  });
}

// ── Drawing helpers ──────────────────────────────────────────────────────────

/** Rounded off-white receipt with a drop shadow and a torn perforated bottom edge. */
function drawPaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const toothW = 18;
  const toothH = 14;
  const teeth = Math.floor(w / toothW);
  const r = 10;

  ctx.save();
  // Shadow cast by the paper.
  ctx.shadowColor = PAPER_SHADOW;
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 20;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - toothH);
  // Zig-zag perforated bottom edge.
  for (let i = 0; i < teeth; i++) {
    const tx = x + w - i * toothW;
    ctx.lineTo(tx - toothW / 2, y + h);
    ctx.lineTo(tx - toothW, y + h - toothH);
  }
  ctx.lineTo(x, y + h - toothH);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.restore();
}

/** A red, slightly-rotated rubber-stamp verdict. */
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.06);
  ctx.font = `900 88px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 56;
  const h = 118;
  ctx.lineWidth = 7;
  ctx.strokeStyle = RED;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 14);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.fillText(text, 0, 6);
  ctx.restore();
}

/** Left label + right value, receipt style. Returns the next y. */
function lineItem(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  y: number,
  label: string,
  value: string,
): number {
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(label, left, y);
  ctx.textAlign = 'right';
  ctx.font = `700 28px ${MONO}`;
  ctx.fillText(value, right, y);
  ctx.font = `400 26px ${MONO}`;
  return y + 44;
}

/** Center-wrapped text; returns the y after the last line. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxW: number,
  font: string,
  lineH: number,
): number {
  ctx.font = font;
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, cursor);
      cursor += lineH;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, cx, cursor);
    cursor += lineH;
  }
  return cursor;
}

function dottedRule(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 3;
  ctx.setLineDash([2, 8]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
  return `${out}…`;
}
