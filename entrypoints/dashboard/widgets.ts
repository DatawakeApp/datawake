import { el } from './dom';
import { icon } from '../../lib/ui/icons';
import { categoryColor, categoryMeta, impactColor } from '../../lib/trackers/categories';
import { companyLogoEl } from '../../lib/trackers/logos';

export function statCard(num: string, label: string): HTMLElement {
  return el('div', { class: 'card' }, el('div', { class: 'num' }, num), el('div', { class: 'lbl' }, label));
}

/** A small coloured category chip, optionally with a count. */
export function categoryChip(category?: string, count?: number): HTMLElement {
  const m = categoryMeta(category);
  const chip = el('span', { class: 'chip', style: `color:${m.color}` });
  chip.append(icon(m.icon, 13), document.createTextNode(`${m.label}${count != null ? ` · ${count}` : ''}`));
  return chip;
}

/** Outlined, icon-led category badge. */
export function catBadge(category?: string): HTMLElement {
  const m = categoryMeta(category);
  const b = el('span', { class: 'cbadge', style: `color:${m.color};border-color:${m.color}` });
  b.append(icon(m.icon, 12), document.createTextNode(m.label));
  return b;
}

export function impactTag(category?: string): HTMLElement {
  const m = categoryMeta(category);
  return el('span', { class: 'itag', style: `background:${impactColor(m.impact)}` }, m.impact);
}

export interface CompanyRowData {
  entity: string;
  category?: string;
  count: number;
  sites: number;
}

/** A clickable company row: logo, name, quiet metadata and a small risk dot. Click opens its detail. */
export function companyRow(e: CompanyRowData, onClick?: (entity: string, category?: string) => void): HTMLElement {
  const m = categoryMeta(e.category);
  const row = el('button', { class: 'crow-btn', type: 'button' });
  const risk = el('span', { class: 'risk', title: `${m.impact} risk` }, el('span', { class: 'risk-dot', style: `--risk:${impactColor(m.impact)}` }), m.impact);
  row.append(
    companyLogoEl(e.entity, m.color),
    el('span', { class: 'cname' }, e.entity),
    // `sites` is 0 inside a single site's sheet, where a site count means nothing.
    el('span', { class: 'muted cmeta' }, e.sites > 0 ? `${m.label} · ${e.sites} site${e.sites === 1 ? '' : 's'}` : m.label),
    risk,
    icon('chevron-right', 18, 'chev'),
  );
  if (onClick) row.addEventListener('click', () => onClick(e.entity, e.category));
  return row;
}

/** A KPI metric card with a big number, label, optional sparkline, and optional trend. */
export function kpiCard(value: string, label: string, spark?: SVGElement, accent?: string, trend?: number | null): HTMLElement {
  const card = el('div', { class: 'kpi' });
  if (accent) {
    card.style.setProperty('--kpi-accent', accent);
    card.style.setProperty('--kpi-glow', accent + '45');
  }
  const top = el('div', { class: 'kpi-top' }, el('div', { class: 'kpi-num' }, value));
  if (spark) top.append(spark);
  card.append(top);
  const lbl = el('div', { class: 'kpi-label' }, label);
  if (trend != null) {
    const up = trend >= 0;
    const sign = up ? '↑' : '↓';
    // More trackers = worse. Red for increase, green for decrease.
    const color = up ? '#f1707a' : '#5bd6a5';
    lbl.append(el('span', { class: 'kpi-trend', style: `color:${color}` }, ` ${sign}${Math.abs(trend)}%`));
  }
  card.append(lbl);
  return card;
}

/** A titled widget card (for charts / sections of the overview). */
export function widget(title: string, ...children: (Node | string)[]): HTMLElement {
  return el('section', { class: 'widget' }, el('div', { class: 'widget-h' }, title), el('div', { class: 'widget-body' }, ...children));
}


export interface FilterOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/** A row of filter tabs; empty options (count 0) are hidden except the first ("All"). */
export function filterTabs<T extends string>(options: FilterOption<T>[], active: T, onChange: (id: T) => void): HTMLElement {
  const bar = el('div', { class: 'period filter-tabs', role: 'tablist' });
  options.forEach((o, i) => {
    if (i > 0 && o.count === 0) return;
    const b = el('button', { class: 'period-btn' + (o.id === active ? ' active' : ''), type: 'button', role: 'tab', 'aria-selected': String(o.id === active) });
    b.append(o.label);
    if (o.count != null) b.append(el('span', { class: 'tab-count' }, String(o.count)));
    b.addEventListener('click', () => onChange(o.id));
    bar.append(b);
  });
  return bar;
}

export type SiteFlagKind = 'violation' | 'payOrOk' | 'fingerprint' | 'rejected';

export const SITE_FLAG_META: Record<SiteFlagKind, { label: string; color: string }> = {
  violation: { label: 'Tracked after Reject', color: 'var(--danger)' },
  payOrOk: { label: 'Pay to refuse', color: 'var(--purple)' },
  fingerprint: { label: 'Fingerprinted you', color: 'var(--amber)' },
  rejected: { label: 'Rejected for you', color: 'var(--accent)' },
};

/** A small status pill for what happened on a site. */
export function siteFlagChip(flag: SiteFlagKind): HTMLElement {
  const m = SITE_FLAG_META[flag];
  return el('span', { class: 'flag-chip', style: `--flag:${m.color}` }, m.label);
}
