import { describe, it, expect } from 'vitest';
import { filterCompanies, companyCounts } from '../lib/dashboard/companies';

const list = [
  { entity: 'Google (Alphabet)', category: 'Advertising' },
  { entity: 'Criteo', category: 'Advertising' },
  { entity: 'Comscore', category: 'Analytics' },
  { entity: 'Fonticons', category: 'Content' },
];
const flows: Record<string, 'sells' | 'shares' | 'internal'> = { Criteo: 'sells', Comscore: 'sells', 'Google (Alphabet)': 'shares' };
const flowOf = (e: string) => flows[e];

describe('filterCompanies', () => {
  it('filters by what they do with your data', () => {
    expect(filterCompanies(list, 'sells', '', flowOf).map((c) => c.entity)).toEqual(['Criteo', 'Comscore']);
    expect(filterCompanies(list, 'shares', '', flowOf).map((c) => c.entity)).toEqual(['Google (Alphabet)']);
  });

  it('filters high risk by category', () => {
    expect(filterCompanies(list, 'high', '', flowOf).map((c) => c.entity)).toEqual(['Google (Alphabet)', 'Criteo']);
  });

  it('searches names, case-insensitively', () => {
    expect(filterCompanies(list, 'all', 'goo', flowOf).map((c) => c.entity)).toEqual(['Google (Alphabet)']);
  });
});

describe('companyCounts', () => {
  it('counts each filter', () => {
    expect(companyCounts(list, flowOf)).toEqual({ all: 4, sells: 2, shares: 1, high: 2 });
  });
});
