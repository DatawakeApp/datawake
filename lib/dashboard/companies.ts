import type { Sharing } from '../brokers/flows';
import { categoryMeta } from '../trackers/categories';

export type CompanyFilter = 'all' | 'sells' | 'shares' | 'high';
export const COMPANY_FILTERS: readonly CompanyFilter[] = ['all', 'sells', 'shares', 'high'];

interface Company {
  entity: string;
  category?: string;
}

type FlowOf = (entity: string) => Sharing | undefined;

const matches = (c: Company, filter: CompanyFilter, flowOf: FlowOf): boolean => {
  if (filter === 'sells' || filter === 'shares') return flowOf(c.entity) === filter;
  if (filter === 'high') return categoryMeta(c.category).impact === 'High';
  return true;
};

export function filterCompanies<T extends Company>(list: readonly T[], filter: CompanyFilter, query: string, flowOf: FlowOf): T[] {
  const q = query.trim().toLowerCase();
  return list.filter((c) => matches(c, filter, flowOf) && (!q || c.entity.toLowerCase().includes(q)));
}

export function companyCounts(list: readonly Company[], flowOf: FlowOf): Record<CompanyFilter, number> {
  const counts = { all: 0, sells: 0, shares: 0, high: 0 };
  for (const f of COMPANY_FILTERS) counts[f] = list.filter((c) => matches(c, f, flowOf)).length;
  return counts;
}
