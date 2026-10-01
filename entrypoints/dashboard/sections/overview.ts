import { brandMark } from '../../../lib/ui/brand-mark';
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { kpiCard, widget, siteFlagChip } from '../widgets';
import { dailyColumns, donut, legend, rankedBars, type Segment } from '../../../lib/ui/charts';
import { padDaily } from '../../../lib/ui/pad-daily';
import { summarizeActions } from '../../../lib/storage/actions-summary';
import { openCompanyDetail, openSiteDetail } from './detail';
import { historyStats, listActions } from '../../../lib/storage/db';
import { summarizeSites, needsAttention, type SiteRow } from '../../../lib/dashboard/sites';
import { mergeCategories, trendReady } from '../../../lib/dashboard/numbers';
import { categoryColor } from '../../../lib/trackers/categories';
import { dataFlow } from '../../../lib/brokers/flows';
import { navigate } from '../bus';

const DAY = 86_400_000;

export async function renderOverview(root: HTMLElement): Promise<void> {
  root.replaceChildren(skeleton());

  const [stats30, stats60, statsAll, actions] = await Promise.all([
    historyStats(30 * DAY),
    historyStats(60 * DAY),
    historyStats(Number.MAX_SAFE_INTEGER),
    listActions(),
  ]);
  const known = stats30.entities.filter((e) => e.known);
  const did = didForYou(summarizeActions(actions, 30 * DAY));
  const attention = needsAttention(summarizeSites(statsAll.perSite, actions), 5);

  if (stats30.totalEvents === 0) {
    const box = el('div', { class: 'empty' });
    box.append(brandMark(44, 'empty-ic'));
    box.append(el('p', { class: 'empty-title' }, 'No tracking recorded yet'));
    box.append(el('p', { class: 'muted' }, 'Browse a few sites, then come back. This overview fills in by itself.'));
    root.replaceChildren(el('div', { class: 'stack' }, did, box));
    return;
  }

  // Trend: identified tracker connections, last 30 days vs the 30 before.
  const prevEvents = stats60.knownEvents - stats30.knownEvents;
  const connectionsTrend = prevEvents > 0 ? Math.round(((stats30.knownEvents - prevEvents) / prevEvents) * 100) : null;
  const segments: Segment[] = mergeCategories(stats30.categories, 6).map((c) => ({ label: c.label, value: c.count, color: categoryColor(c.category) }));

  const wrap = el('div', { class: 'stack' });
  wrap.append(did);
  if (attention.length) wrap.append(attentionWidget(attention));

  const sellers = known.filter((e) => dataFlow(e.entity)?.sharing === 'sells').length;
  wrap.append(el('div', { class: 'grid kpis' },
    linked(kpiCard(String(known.length), known.length === 1 ? 'company tracked you' : 'companies tracked you'), 'companies'),
    linked(kpiCard(String(stats30.siteCount), stats30.siteCount === 1 ? 'site visited' : 'sites visited'), 'sites'),
    kpiCard(String(stats30.knownEvents), 'tracker connections', undefined, undefined, connectionsTrend),
    linked(kpiCard(String(sellers), sellers === 1 ? 'company that sells your data' : 'companies that sell your data'), 'companies:sells'),
  ));

  wrap.append(
    el(
      'div',
      { class: 'grid-2' },
      widget('Trackers seen per day', trendReady(stats30.daily) ? dailyColumns(padDaily(stats30.daily, 30).map((d) => ({ label: shortDay(d.day), value: d.count }))) : trendPending(stats30.daily)),
      widget('By category', el('div', { class: 'donut-wrap' }, donut(segments), legend(segments))),
    ),
  );

  const top = widget(
    'Who tracks you most',
    rankedBars(
      known.slice(0, 8).map((e) => ({
        label: e.entity,
        value: e.count,
        color: 'var(--bar)',
        onClick: () => void openCompanyDetail(e.entity, e.category),
      })),
    ),
    seeAll(`See all ${known.length} companies`, 'companies'),
  );
  wrap.append(top);

  root.replaceChildren(wrap);
  animateKpis(root);
}

/** Sites where something needs the user's attention, newest first. */
function attentionWidget(rows: SiteRow[]): HTMLElement {
  const list = el('div', { class: 'list' });
  for (const r of rows) {
    const row = el('button', { class: 'site-row', type: 'button' });
    row.append(
      el('span', { class: 'site-main' }, el('span', { class: 'sitename' }, r.site)),
      el('span', { class: 'site-flags' }, ...r.flags.filter((f) => f !== 'rejected').map(siteFlagChip)),
      icon('chevron-right', 16, 'chev'),
    );
    row.addEventListener('click', () => openSiteDetail(r.site));
    list.append(row);
  }
  return widget('Needs your attention', list, seeAll('See all sites', 'sites'));
}

/** Until there are a few days of data, say so instead of drawing a lone bar. */
function trendPending(daily: Array<{ day: string; count: number }>): HTMLElement {
  const first = daily.find((d) => d.count > 0)?.day;
  const since = first ? new Date(`${first}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'today';
  return el('div', { class: 'trend-pending' },
    el('p', { class: 'trend-pending-title' }, `Watching since ${since}`),
    el('p', { class: 'muted' }, 'The daily trend appears after a few days of browsing.'),
  );
}

function seeAll(label: string, target: string): HTMLElement {
  const b = el('button', { class: 'see-all', type: 'button' }, label);
  b.append(icon('chevron-right', 14));
  b.addEventListener('click', () => navigate(target));
  return b;
}

/** Make a KPI card open the section behind the number. */
function linked(card: HTMLElement, target: string): HTMLElement {
  card.classList.add('kpi-link');
  card.setAttribute('role', 'link');
  card.tabIndex = 0;
  card.addEventListener('click', () => navigate(target));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(target); });
  return card;
}

/** "What Datawake did for you" over the last 30 days: the value it adds, not just what trackers did. */
function didForYou(sum: ReturnType<typeof summarizeActions>): HTMLElement {
  const items: Array<[number, string, string]> = [
    [sum.rejected, sum.rejected === 1 ? 'cookie banner rejected for you' : 'cookie banners rejected for you', 'sites:rejected'],
    [sum.payOrOk, sum.payOrOk === 1 ? 'site that makes you pay to say no' : 'sites that make you pay to say no', 'sites:payOrOk'],
    [sum.fingerprint, sum.fingerprint === 1 ? 'site caught fingerprinting' : 'sites caught fingerprinting', 'sites:fingerprint'],
    [sum.violation, sum.violation === 1 ? 'site tracked you after you said no' : 'sites tracked you after you said no', 'violations'],
  ];
  const grid = el('div', { class: 'did-grid' });
  for (const [n, label, target] of items) {
    const item = el('button', { class: 'did-item', type: 'button', disabled: n === 0 },
      el('span', { class: 'did-num' }, n.toLocaleString('en-US')), el('span', { class: 'did-label' }, label));
    item.addEventListener('click', () => navigate(target));
    grid.append(item);
  }
  return widget('What Datawake did for you · last 30 days', grid);
}

function shortDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function animateKpis(root: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('.kpi-num').forEach((el) => {
    const target = parseInt(el.textContent ?? '0', 10);
    if (!isNaN(target) && target > 1) countUp(el as HTMLElement, target);
  });
}

function countUp(el: HTMLElement, target: number, duration = 700): void {
  const start = performance.now();
  const step = (now: number): void => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function skeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  const kpis = el('div', { class: 'grid kpis' });
  for (let i = 0; i < 3; i++) kpis.append(el('div', { class: 'kpi skeleton' }));
  const charts = el('div', { class: 'grid-2' }, el('div', { class: 'widget skeleton tall' }), el('div', { class: 'widget skeleton tall' }));
  box.append(kpis, charts);
  return box;
}
