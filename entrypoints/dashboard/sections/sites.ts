/** Sites: every site you visited, what tracked you there, and what Datawake did or caught. */
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { filterTabs, siteFlagChip, SITE_FLAG_META, type FilterOption } from '../widgets';
import { openSiteDetail } from './detail';
import { historyStats, listActions } from '../../../lib/storage/db';
import { summarizeSites, filterSites, SITE_FLAGS, type SiteFlag, type SiteRow } from '../../../lib/dashboard/sites';

const PAGE = 40;

export async function renderSites(root: HTMLElement, initial: SiteFlag | 'all' = 'all'): Promise<void> {
  root.replaceChildren(listSkeleton());
  const [stats, actions] = await Promise.all([historyStats(Number.MAX_SAFE_INTEGER), listActions()]);
  const rows = summarizeSites(stats.perSite, actions);

  if (rows.length === 0) {
    root.replaceChildren(el('div', { class: 'empty' },
      icon('grid', 36, 'empty-ic'),
      el('p', { class: 'empty-title' }, 'No sites yet'),
      el('p', { class: 'muted' }, 'Every site you visit appears here, with who tracked you and what Datawake did about it.'),
    ));
    return;
  }

  let flag: SiteFlag | 'all' = initial;
  let query = '';
  let limit = PAGE;
  const wrap = el('div', { class: 'stack' });
  const tabsHost = el('div');
  const search = el('input', { type: 'search', class: 'search', placeholder: 'Search sites…', 'aria-label': 'Search sites' }) as HTMLInputElement;
  const list = el('div', { class: 'list' });
  const more = el('div');

  const options = (): FilterOption<SiteFlag | 'all'>[] => [
    { id: 'all', label: 'All', count: rows.length },
    ...SITE_FLAGS.map((f) => ({ id: f, label: SITE_FLAG_META[f].label, count: rows.filter((r) => r.flags.includes(f)).length })),
  ];

  const draw = (): void => {
    tabsHost.replaceChildren(filterTabs(options(), flag, (id) => { flag = id; limit = PAGE; draw(); }));
    const shown = filterSites(rows, flag, query);
    list.replaceChildren(...shown.slice(0, limit).map(siteRow));
    if (shown.length === 0) list.append(el('p', { class: 'muted' }, 'No sites match.'));
    more.replaceChildren();
    if (shown.length > limit) {
      const btn = el('button', { class: 'btn secondary', type: 'button' }, `Show all ${shown.length}`);
      btn.addEventListener('click', () => { limit = Infinity; draw(); });
      more.append(btn);
    }
  };
  search.addEventListener('input', () => { query = search.value; limit = PAGE; draw(); });

  wrap.append(tabsHost, search, list, more);
  root.replaceChildren(wrap);
  draw();
}

function siteRow(r: SiteRow): HTMLElement {
  const row = el('button', { class: 'site-row', type: 'button' });
  const flags = el('span', { class: 'site-flags' }, ...r.flags.filter((f) => f !== 'rejected' || r.flags.length === 1).map(siteFlagChip));
  row.append(
    el('span', { class: 'site-main' },
      el('span', { class: 'sitename' }, r.site),
      el('span', { class: 'muted site-meta' }, r.companies === 0 ? 'No trackers recorded' : `${r.companies} ${r.companies === 1 ? 'company' : 'companies'} tracked you`),
    ),
    flags,
    icon('chevron-right', 16, 'chev'),
  );
  row.addEventListener('click', () => openSiteDetail(r.site));
  return row;
}

function listSkeleton(): HTMLElement {
  const list = el('div', { class: 'list' });
  for (let i = 0; i < 8; i++) list.append(el('div', { class: 'skeleton', style: 'height:52px;border-radius:9px' }));
  return list;
}
