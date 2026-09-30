/**
 * "What Datawake did for you": the protective actions taken on your behalf, summarised for the
 * dashboard. Pure (no storage), so it can be tested directly.
 */

export type ActionKind = 'rejected' | 'payOrOk' | 'fingerprint' | 'violation';

export interface ActionEntry {
  id?: number;
  kind: ActionKind;
  site: string;
  timestamp: number;
}

export interface ActionSummary extends Record<ActionKind, number> {
  /** Distinct sites where Datawake did something. */
  sites: number;
}

export function summarizeActions(rows: readonly ActionEntry[], windowMs: number, now = Date.now()): ActionSummary {
  const since = now - windowMs;
  const summary: ActionSummary = { rejected: 0, payOrOk: 0, fingerprint: 0, violation: 0, sites: 0 };
  const sites = new Set<string>();
  for (const r of rows) {
    if (r.timestamp < since) continue;
    summary[r.kind] += 1;
    sites.add(r.site);
  }
  return { ...summary, sites: sites.size };
}
