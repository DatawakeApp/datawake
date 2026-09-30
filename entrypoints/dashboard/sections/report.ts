import { el } from '../dom';
import { statCard, categoryChip, companyRow } from '../widgets';
import { openCompanyDetail, openSiteDetail } from './detail';
import { categoryColor } from '../../../lib/trackers/categories';
import { historyStats, type HistoryStats } from '../../../lib/storage/db';

const DAY = 86_400_000;
const PERIODS = [
  { label: '7 days', ms: 7 * DAY },
  { label: '30 days', ms: 30 * DAY },
  { label: 'All', ms: Number.MAX_SAFE_INTEGER },
];

export async function renderReport(root: HTMLElement): Promise<void> {
  let periodIdx = 0;

  const draw = async (): Promise<void> => {
    root.replaceChildren(reportSkeleton());
    root.replaceChildren(view(await historyStats(PERIODS[periodIdx].ms)));
  };

  function view(stats: HistoryStats): HTMLElement {
    const wrap = el('div');

    const tabs = el('div', { class: 'period' });
    PERIODS.forEach((p, i) => {
      const b = el('button', { class: 'period-btn' + (i === periodIdx ? ' active' : ''), textContent: p.label });
      b.addEventListener('click', () => {
        periodIdx = i;
        void draw();
      });
      tabs.append(b);
    });
    wrap.append(tabs);

    if (stats.totalEvents === 0) {
      wrap.append(el('p', { class: 'empty' }, 'No tracking recorded yet for this period. Browse a few sites and come back.'));
      return wrap;
    }

    const known = stats.entities.filter((e) => e.known);
    const topCat = stats.categories[0]?.category;

    wrap.append(
      el(
        'p',
        { class: 'summary-line' },
        'This period, ',
        el('strong', {}, `${known.length} companies`),
        ' tracked you across ',
        el('strong', {}, `${stats.siteCount} site${stats.siteCount === 1 ? '' : 's'}`),
        topCat ? `, mostly ${topCat.toLowerCase()}.` : '.',
      ),
    );

    if (stats.categories.length) {
      const chips = el('div', { class: 'chips' });
      for (const c of stats.categories) chips.append(categoryChip(c.category, c.count));
      wrap.append(chips);
    }

    wrap.append(
      el(
        'div',
        { class: 'cards' },
        statCard(String(known.length), 'companies tracked you'),
        statCard(String(stats.totalEvents), 'tracker connections'),
        statCard(String(stats.siteCount), 'sites visited'),
      ),
    );

    wrap.append(el('h2', {}, 'Who tracked you most'));
    const list = el('div', { class: 'list' });
    for (const e of known.slice(0, 20)) list.append(companyRow(e, openCompanyDetail));
    wrap.append(list);

    if (stats.categories.length) {
      wrap.append(el('h2', {}, 'What they were doing'));
      const max = Math.max(...stats.categories.map((c) => c.count));
      const bars = el('div', { class: 'bars' });
      for (const c of stats.categories) bars.append(bar(c.category, c.count, max));
      wrap.append(bars);
    }

    wrap.append(el('h2', {}, 'Sites where you were tracked most'));
    const sites = el('div', { class: 'list' });
    for (const s of stats.perSite.slice(0, 15)) {
      const row = el('button', { class: 'siterow siterow-btn', type: 'button' });
      row.append(
        el('span', { class: 'sitename' }, s.site),
        el('span', { class: 'muted' }, `${s.companies} companies · ${s.count} trackers`),
      );
      row.addEventListener('click', () => void openSiteDetail(s.site));
      sites.append(row);
    }
    wrap.append(sites);

    return wrap;
  }

  await draw();
}

function reportSkeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  const cards = el('div', { class: 'cards' });
  for (let i = 0; i < 3; i++) cards.append(el('div', { class: 'card skeleton', style: 'height:80px' }));
  box.append(cards);
  const list = el('div', { class: 'list', style: 'margin-top:16px' });
  for (let i = 0; i < 7; i++) list.append(el('div', { class: 'skeleton', style: 'height:46px;border-radius:9px' }));
  box.append(list);
  return box;
}

function bar(label: string, count: number, max: number): HTMLElement {
  const pct = Math.max(4, Math.round((count / max) * 100));
  const fill = el('span', { class: 'barfill', style: `width:${pct}%;background:${categoryColor(label)}` });
  return el(
    'div',
    { class: 'barrow' },
    el('span', { class: 'barlabel' }, label || 'Other'),
    el('span', { class: 'bartrack' }, fill),
    el('span', { class: 'barnum' }, String(count)),
  );
}
