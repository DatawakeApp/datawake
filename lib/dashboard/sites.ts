import type { ActionEntry, ActionKind } from '../storage/actions-summary';

/** What happened on a site, most serious first. */
export type SiteFlag = ActionKind;
export const SITE_FLAGS: readonly SiteFlag[] = ['violation', 'payOrOk', 'fingerprint', 'rejected'];
/** Flags worth the user's attention (a reject alone is Datawake doing its job). */
const NOTABLE: ReadonlySet<SiteFlag> = new Set(['violation', 'payOrOk', 'fingerprint']);

export interface SiteRow {
  site: string;
  companies: number;
  trackers: number;
  flags: SiteFlag[];
  lastActionAt: number | null;
}

interface PerSite {
  site: string;
  companies: number;
  count: number;
}

const severity = (row: SiteRow): number => (row.flags.length ? SITE_FLAGS.indexOf(row.flags[0]) : SITE_FLAGS.length);

/** One row per site: trackers seen there plus what Datawake did or caught. */
export function summarizeSites(perSite: readonly PerSite[], actions: readonly ActionEntry[]): SiteRow[] {
  const bySite = new Map<string, { flags: Set<SiteFlag>; last: number }>();
  for (const a of actions) {
    const s = bySite.get(a.site) ?? { flags: new Set<SiteFlag>(), last: 0 };
    s.flags.add(a.kind);
    s.last = Math.max(s.last, a.timestamp);
    bySite.set(a.site, s);
  }

  const rows = new Map<string, SiteRow>();
  for (const p of perSite) rows.set(p.site, { site: p.site, companies: p.companies, trackers: p.count, flags: [], lastActionAt: null });
  for (const [site, s] of bySite) {
    const row = rows.get(site) ?? { site, companies: 0, trackers: 0, flags: [], lastActionAt: null };
    rows.set(site, { ...row, flags: SITE_FLAGS.filter((f) => s.flags.has(f)), lastActionAt: s.last });
  }

  return [...rows.values()].sort((a, b) => severity(a) - severity(b) || b.companies - a.companies);
}

export function filterSites(rows: readonly SiteRow[], flag: SiteFlag | 'all', query: string): SiteRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => (flag === 'all' || r.flags.includes(flag)) && (!q || r.site.includes(q)));
}

/** Sites with something the user should know about, newest first. */
export function needsAttention(rows: readonly SiteRow[], limit: number): SiteRow[] {
  return rows
    .filter((r) => r.flags.some((f) => NOTABLE.has(f)))
    .sort((a, b) => (b.lastActionAt ?? 0) - (a.lastActionAt ?? 0))
    .slice(0, limit);
}
