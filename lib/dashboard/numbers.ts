import { categoryMeta } from '../trackers/categories';

export interface MergedCategory {
  label: string;
  /** A raw category with this label, for colour and icon lookups. */
  category: string;
  count: number;
}

/**
 * Categories by display label (several raw ones, like "Tag manager", show as "Other"), largest
 * first. With `limit`, the tail folds into "Other" so totals always match the full count.
 */
export function mergeCategories(categories: ReadonlyArray<{ category: string; count: number }>, limit?: number): MergedCategory[] {
  const byLabel = new Map<string, MergedCategory>();
  for (const c of categories) {
    const label = categoryMeta(c.category).label;
    const prev = byLabel.get(label);
    byLabel.set(label, { label, category: prev?.category ?? c.category, count: (prev?.count ?? 0) + c.count });
  }
  const sorted = [...byLabel.values()].sort((a, b) => b.count - a.count);
  if (limit === undefined || sorted.length <= limit) return sorted;

  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((s, c) => s + c.count, 0);
  const other = head.find((c) => c.label === 'Other');
  const withOther = other
    ? head.map((c) => (c === other ? { ...c, count: c.count + rest } : c))
    : [...head.slice(0, limit - 1), { label: 'Other', category: 'Other', count: rest + head[limit - 1].count }];
  return withOther.sort((a, b) => b.count - a.count);
}

/** A daily trend is only meaningful once there are a few days with data. */
export function trendReady(daily: ReadonlyArray<{ day: string; count: number }>, minDays = 3): boolean {
  return daily.filter((d) => d.count > 0).length >= minDays;
}
