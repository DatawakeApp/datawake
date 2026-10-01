/** Companies: everyone that tracked you, what they do with your data, filterable. */
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { companyRow, filterTabs, type FilterOption } from '../widgets';
import { openCompanyDetail } from './detail';
import { historyStats } from '../../../lib/storage/db';
import { dataFlow } from '../../../lib/brokers/flows';
import { companyCounts, filterCompanies, type CompanyFilter } from '../../../lib/dashboard/companies';

const DAY = 86_400_000;
const PAGE = 30;
const PERIODS = [
  { id: 'all', label: 'All time', ms: Number.MAX_SAFE_INTEGER },
  { id: '30', label: '30 days', ms: 30 * DAY },
  { id: '7', label: '7 days', ms: 7 * DAY },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];

const LABELS: Record<CompanyFilter, string> = {
  all: 'All',
  sells: 'Sell your data',
  shares: 'Share it for ads',
  high: 'High risk',
};
const NOTES: Partial<Record<CompanyFilter, string>> = {
  sells: 'Data brokers and exchanges: they buy and sell audience data. Based on how each company publicly says it works.',
  shares: 'They pass what they learn about you to advertisers and partners to target ads.',
};

const flowOf = (entity: string) => dataFlow(entity)?.sharing;

export async function renderCompanies(root: HTMLElement, initial: CompanyFilter = 'all'): Promise<void> {
  let period: PeriodId = 'all';
  let filter: CompanyFilter = initial;
  let query = '';
  let limit = PAGE;

  const draw = async (): Promise<void> => {
    const stats = await historyStats(PERIODS.find((p) => p.id === period)!.ms);
    const known = stats.entities.filter((e) => e.known);
    const counts = companyCounts(known, flowOf);
    const wrap = el('div', { class: 'stack' });

    const periods = filterTabs(PERIODS.map((p) => ({ id: p.id, label: p.label })), period, (id) => { period = id; limit = PAGE; void draw(); });
    periods.classList.add('period-quiet');

    if (known.length === 0) {
      wrap.append(periods, el('div', { class: 'empty' },
        icon('user', 36, 'empty-ic'),
        el('p', { class: 'empty-title' }, 'No companies in this period'),
        el('p', { class: 'muted' }, 'Browse a few sites and the companies that track you will appear here.'),
      ));
      root.replaceChildren(wrap);
      return;
    }

    wrap.append(
      el('div', { class: 'companies-head' },
        el('p', { class: 'summary-line' },
          el('strong', {}, `${known.length} ${known.length === 1 ? 'company' : 'companies'}`),
          ` tracked you across ${stats.siteCount} ${stats.siteCount === 1 ? 'site' : 'sites'}.`),
        periods,
      ),
    );

    const options: FilterOption<CompanyFilter>[] = (Object.keys(LABELS) as CompanyFilter[]).map((id) => ({ id, label: LABELS[id], count: counts[id] }));
    wrap.append(filterTabs(options, filter, (id) => { filter = id; limit = PAGE; void draw(); }));
    if (NOTES[filter]) wrap.append(el('p', { class: 'muted intro' }, NOTES[filter]!));

    const search = el('input', { type: 'search', class: 'search', placeholder: 'Search companies…', value: query, 'aria-label': 'Search companies' }) as HTMLInputElement;
    const list = el('div', { class: 'list' });
    const more = el('div');
    const fill = (): void => {
      const shown = filterCompanies(known, filter, query, flowOf);
      list.replaceChildren(...shown.slice(0, limit).map((e) => companyRow(e, openCompanyDetail)));
      if (shown.length === 0) list.append(el('p', { class: 'muted' }, 'No companies match.'));
      more.replaceChildren();
      if (shown.length > limit) {
        const btn = el('button', { class: 'btn secondary', type: 'button' }, `Show all ${shown.length}`);
        btn.addEventListener('click', () => { limit = Infinity; fill(); });
        more.append(btn);
      }
    };
    search.addEventListener('input', () => { query = search.value; limit = PAGE; fill(); });
    wrap.append(search, list, more);
    root.replaceChildren(wrap);
    fill();
  };

  root.replaceChildren(el('div', { class: 'list' }, ...Array.from({ length: 8 }, () => el('div', { class: 'skeleton', style: 'height:48px;border-radius:9px' }))));
  await draw();
}
