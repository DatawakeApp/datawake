import { describe, it, expect } from 'vitest';
import { mergeCategories, trendReady } from '../lib/dashboard/numbers';

describe('mergeCategories', () => {
  const cats = [
    { category: 'Advertising', count: 91 },
    { category: 'Other', count: 54 },
    { category: 'Analytics', count: 18 },
    { category: 'Badge', count: 13 }, // no label of its own: shown as "Other"
    { category: 'Content', count: 5 },
    { category: 'Social', count: 2 },
    { category: 'Customer data', count: 1 },
  ];

  it('merges categories that share a display label, keeping the total', () => {
    const m = mergeCategories(cats);
    expect(m.find((c) => c.label === 'Other')?.count).toBe(67);
    expect(m.reduce((s, c) => s + c.count, 0)).toBe(184);
    expect(m.map((c) => c.label)).toEqual(['Advertising', 'Other', 'Analytics', 'Content', 'Social', 'Customer data']);
  });

  it('folds the tail into Other when limited, so the total still adds up', () => {
    const m = mergeCategories(cats, 3);
    expect(m.map((c) => c.label)).toEqual(['Advertising', 'Other', 'Analytics']);
    expect(m.reduce((s, c) => s + c.count, 0)).toBe(184);
    expect(m.find((c) => c.label === 'Other')?.count).toBe(75);
  });
});

describe('trendReady', () => {
  it('needs at least three days with data', () => {
    expect(trendReady([{ day: '2026-10-01', count: 9 }])).toBe(false);
    expect(trendReady([{ day: '2026-09-29', count: 1 }, { day: '2026-09-30', count: 0 }, { day: '2026-10-01', count: 3 }])).toBe(false);
    expect(trendReady([{ day: '2026-09-29', count: 1 }, { day: '2026-09-30', count: 2 }, { day: '2026-10-01', count: 3 }])).toBe(true);
  });
});
