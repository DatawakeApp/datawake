import { brandMark } from '../../../lib/ui/brand-mark';
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { kpiCard, widget } from '../widgets';
import { dailyColumns, donut, legend, rankedBars, type Point, type Segment } from '../../../lib/ui/charts';
import { padDaily } from '../../../lib/ui/pad-daily';
import { summarizeActions } from '../../../lib/storage/actions-summary';
import { openCompanyDetail } from './detail';
import { historyStats, listActions, listViolations } from '../../../lib/storage/db';
import { categoryColor } from '../../../lib/trackers/categories';
import { dataFlow, sharingLabel, type Sharing } from '../../../lib/brokers/flows';
import { navigate } from '../bus';

const DAY = 86_400_000;

export async function renderOverview(root: HTMLElement): Promise<void> {
  root.replaceChildren(skeleton());

  const [stats30, stats60, violations, actions] = await Promise.all([
    historyStats(30 * DAY),
    historyStats(60 * DAY),
    listViolations(),
    listActions(),
  ]);
  const known = stats30.entities.filter((e) => e.known);
  const did = didForYou(summarizeActions(actions, 30 * DAY));

  if (stats30.totalEvents === 0) {
    const box = el('div', { class: 'empty' });
    box.append(brandMark(44, 'empty-ic'));
    box.append(el('p', { class: 'empty-title' }, 'No tracking recorded yet'));
    box.append(el('p', { class: 'muted' }, 'Browse a few sites, then come back. This overview fills in by itself.'));
    root.replaceChildren(el('div', { class: 'stack' }, did, box));
    return;
  }

  // Trend: compare last 30 days vs the 30 days before
  const prevEvents = stats60.totalEvents - stats30.totalEvents;
  const connectionsTrend = prevEvents > 0 ? Math.round(((stats30.totalEvents - prevEvents) / prevEvents) * 100) : null;

  const points: Point[] = padDaily(stats30.daily, 30).map((d) => ({ label: shortDay(d.day), value: d.count }));
  const segments: Segment[] = stats30.categories
    .slice(0, 6)
    .map((c) => ({ label: c.category || 'Other', value: c.count, color: categoryColor(c.category) }));

  const wrap = el('div', { class: 'stack' });
  wrap.append(did);

  // KPI row, we'll animate numbers after append
  const kpiCompanies = kpiCard(String(known.length), 'companies tracked you');
  const kpiSites = kpiCard(String(stats30.siteCount), 'sites visited');
  const kpiConnections = kpiCard(String(stats30.totalEvents), 'tracker connections', undefined, undefined, connectionsTrend);
  const sellers = known.filter((e) => dataFlow(e.entity)?.sharing === 'sells').length;
  const kpiViolations = kpiCard(String(sellers), sellers === 1 ? 'company that sells your data' : 'companies that sell your data');
  if (sellers > 0) {
    kpiViolations.style.cursor = 'pointer';
    kpiViolations.addEventListener('click', () => navigate('exposure'));
  }
  wrap.append(el('div', { class: 'grid kpis' }, kpiCompanies, kpiSites, kpiConnections, kpiViolations));

  // Charts row
  wrap.append(
    el(
      'div',
      { class: 'grid-2' },
      widget('Trackers seen per day', dailyColumns(points)),
      widget('By category', el('div', { class: 'donut-wrap' }, donut(segments), legend(segments))),
    ),
  );

  // Who tracks you most
  wrap.append(
    widget(
      'Who tracks you most',
      rankedBars(
        known.slice(0, 8).map((e) => ({
          label: e.entity,
          value: e.count,
          color: 'var(--bar)',
          onClick: () => void openCompanyDetail(e.entity, e.category),
        })),
      ),
    ),
  );

  // Where your data goes, pills navigate to the flows section
  const counts: Record<Sharing, number> = { sells: 0, shares: 0, internal: 0 };
  for (const e of known) {
    const f = dataFlow(e.entity);
    if (f) counts[f.sharing] += 1;
  }
  const goes = el('div', { class: 'goes' });
  (['sells', 'shares', 'internal'] as Sharing[]).forEach((k) => {
    const pill = el('button', { class: 'goes-pill', type: 'button' });
    pill.append(
      el('span', { class: 'goes-num' }, String(counts[k])),
      el('span', { class: 'goes-lbl' }, sharingLabel(k)),
    );
    pill.addEventListener('click', () => navigate('flows'));
    goes.append(pill);
  });
  wrap.append(widget('Where your data goes', goes));

  root.replaceChildren(wrap);
  animateKpis(root);
}

/** "What Datawake did for you" over the last 30 days: the value it adds, not just what trackers did. */
function didForYou(sum: ReturnType<typeof summarizeActions>): HTMLElement {
  const items: Array<[number, string]> = [
    [sum.rejected, sum.rejected === 1 ? 'cookie banner rejected for you' : 'cookie banners rejected for you'],
    [sum.payOrOk, sum.payOrOk === 1 ? 'site that makes you pay to say no' : 'sites that make you pay to say no'],
    [sum.fingerprint, sum.fingerprint === 1 ? 'site caught fingerprinting' : 'sites caught fingerprinting'],
    [sum.violation, sum.violation === 1 ? 'site tracked you after you said no' : 'sites tracked you after you said no'],
  ];
  const grid = el('div', { class: 'did-grid' });
  for (const [n, label] of items) {
    grid.append(el('div', { class: 'did-item' }, el('span', { class: 'did-num' }, n.toLocaleString('en-US')), el('span', { class: 'did-label' }, label)));
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
