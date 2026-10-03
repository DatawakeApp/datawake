/** Zero-dependency SVG charts (responsive viewBox, theme via CSS classes for colours). */
const NS = 'http://www.w3.org/2000/svg';

function svg(tag: string, attrs: Record<string, string | number> = {}): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export function sparkline(values: number[], color: string, w = 96, h = 30): SVGElement {
  const el = svg('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: 'spark', 'aria-hidden': 'true' });
  if (values.length < 2) return el;
  const max = Math.max(1, ...values);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 5) - 3).toFixed(1)}`).join(' ');
  el.append(svg('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return el;
}

export interface Point {
  label: string;
  value: number;
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

export function donut(segments: Segment[], size = 168): SVGElement {
  const stroke = 26;
  const r = size / 2 - stroke / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const el = svg('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: 'donut', role: 'img' });
  el.setAttribute('aria-label', 'Tracker categories');
  el.append(svg('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', class: 'donut-track', 'stroke-width': stroke }));
  let offset = 0;
  for (const seg of segments) {
    const len = (seg.value / total) * C;
    el.append(
      svg('circle', {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: 'none',
        stroke: seg.color,
        'stroke-width': stroke,
        'stroke-dasharray': `${len.toFixed(2)} ${(C - len).toFixed(2)}`,
        'stroke-dashoffset': (-offset).toFixed(2),
        transform: `rotate(-90 ${size / 2} ${size / 2})`,
      }),
    );
    offset += len;
  }
  const num = svg('text', { x: size / 2, y: size / 2 - 4, 'text-anchor': 'middle', class: 'donut-num' });
  num.textContent = String(total);
  const sub = svg('text', { x: size / 2, y: size / 2 + 16, 'text-anchor': 'middle', class: 'donut-sub' });
  sub.textContent = 'connections';
  el.append(num, sub);
  return el;
}

export function legend(segments: Segment[]): HTMLElement {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const box = document.createElement('div');
  box.className = 'legend';
  for (const s of segments) {
    const row = document.createElement('div');
    row.className = 'legend-row';
    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.background = s.color;
    const name = document.createElement('span');
    name.className = 'legend-name';
    name.textContent = s.label;
    const val = document.createElement('span');
    val.className = 'legend-val';
    val.textContent = `${Math.round((s.value / total) * 100)}%`;
    row.append(dot, name, val);
    box.append(row);
  }
  return box;
}

export interface RankedItem {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

export function rankedBars(items: RankedItem[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'ranked';
  const max = Math.max(1, ...items.map((i) => i.value));
  for (const it of items) {
    const row = document.createElement(it.onClick ? 'button' : 'div');
    row.className = 'ranked-row';
    if (it.onClick) {
      (row as HTMLButtonElement).type = 'button';
      row.addEventListener('click', it.onClick);
    }
    const label = document.createElement('span');
    label.className = 'ranked-label';
    label.textContent = it.label;
    const track = document.createElement('span');
    track.className = 'ranked-track';
    const fill = document.createElement('span');
    fill.className = 'ranked-fill';
    fill.style.width = `${Math.max(3, (it.value / max) * 100)}%`;
    fill.style.background = it.color;
    track.append(fill);
    const val = document.createElement('span');
    val.className = 'ranked-val';
    val.textContent = String(it.value);
    row.append(label, track, val);
    wrap.append(row);
  }
  return wrap;
}

/** Daily columns: reads well with any amount of data, from a single day to a full month. */
export function dailyColumns(data: Point[], label = 'Trackers seen per day'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'chart';
  const W = 620;
  const H = 160;
  const gap = 3;
  const el = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', class: 'chart-svg', role: 'img' });
  el.setAttribute('aria-label', label);
  const n = Math.max(1, data.length);
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = W / n - gap;
  el.append(svg('line', { x1: 0, y1: H - 0.5, x2: W, y2: H - 0.5, class: 'grid-line' }));
  data.forEach((d, i) => {
    const h = d.value === 0 ? 0 : Math.max(3, (d.value / max) * (H - 6));
    const rect = svg('rect', { x: (i * (W / n) + gap / 2).toFixed(1), y: (H - h).toFixed(1), width: barW.toFixed(1), height: h.toFixed(1), rx: 2, class: 'col' });
    const title = svg('title');
    title.textContent = `${d.label}: ${d.value}`;
    rect.append(title);
    el.append(rect);
  });
  wrap.append(el);
  const labels = document.createElement('div');
  labels.className = 'chart-x';
  for (const i of [0, Math.floor((data.length - 1) / 2), data.length - 1]) {
    const s = document.createElement('span');
    s.textContent = data[i]?.label ?? '';
    labels.append(s);
  }
  wrap.append(labels);
  return wrap;
}
