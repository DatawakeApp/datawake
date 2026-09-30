import Dexie, { type Table } from 'dexie';
import { computeProfile, type CategoryProfile } from '../trackers/site-categories';

export interface TrackEvent {
  id?: number;
  /** Epoch milliseconds when first seen on a page. */
  ts: number;
  site: string;
  entity: string;
  trackerDomain: string;
  known: boolean;
  category?: string;
}

export interface AccountEntry {
  id?: number;
  company: string;
  domain?: string;
  source: 'manual' | 'detected';
  addedAt: number;
}

export interface RequestEntry {
  id?: number;
  company: string;
  kind: 'access' | 'erasure';
  status: 'draft' | 'sent' | 'responded' | 'done';
  createdAt: number;
  updatedAt: number;
  contact?: string;
  notes?: string;
}

export interface ViolationEntry {
  id?: number;
  site: string;
  url: string;
  timestamp: number;
  newCookies: Array<{ name: string; domain: string }>;
}

class DatawakeDB extends Dexie {
  events!: Table<TrackEvent, number>;
  accounts!: Table<AccountEntry, number>;
  requests!: Table<RequestEntry, number>;
  violations!: Table<ViolationEntry, number>;

  constructor() {
    super('trace');
    this.version(1).stores({ events: '++id, ts, site, entity, known' });
    this.version(2).stores({
      events: '++id, ts, site, entity, known, category',
      accounts: '++id, company, source, addedAt',
      requests: '++id, company, kind, status, createdAt',
    });
    this.version(3).stores({
      events: '++id, ts, site, entity, known, category',
      accounts: '++id, company, source, addedAt',
      requests: '++id, company, kind, status, createdAt',
      violations: '++id, site, timestamp',
    });
  }
}

export const db = new DatawakeDB();

const RETAIN_MS = 90 * 24 * 60 * 60 * 1000; // keep ~90 days so the footprint is meaningful

/** Append a first-seen tracker hit (call once per tab+domain+page to keep it bounded). */
export async function recordHistory(e: Omit<TrackEvent, 'id'>): Promise<void> {
  await db.events.add(e);
}

/** Drop events older than the retention window so local storage never grows without bound. */
export async function pruneOld(now = Date.now()): Promise<void> {
  await db.events.where('ts').below(now - RETAIN_MS).delete();
}

// ── Aggregation ────────────────────────────────────────────────────────────

export interface EntityStat {
  entity: string;
  count: number;
  known: boolean;
  category?: string;
  sites: number;
}

export interface HistoryStats {
  totalEvents: number;
  knownEvents: number;
  siteCount: number;
  entityCount: number;
  entities: EntityStat[];
  categories: { category: string; count: number }[];
  perSite: { site: string; companies: number; count: number }[];
  daily: { day: string; count: number }[];
}

/** Aggregate the local history over the last `windowMs` (use a huge value for all-time). */
export async function historyStats(windowMs: number, now = Date.now()): Promise<HistoryStats> {
  const since = now - windowMs;
  const rows = await db.events.where('ts').aboveOrEqual(since).toArray();

  const ent = new Map<string, { count: number; known: boolean; category?: string; sites: Set<string> }>();
  const cat = new Map<string, number>();
  const site = new Map<string, { companies: Set<string>; count: number }>();
  const day = new Map<string, number>();

  for (const r of rows) {
    const e = ent.get(r.entity) ?? { count: 0, known: r.known, category: r.category, sites: new Set<string>() };
    e.count += 1;
    e.known = e.known || r.known;
    if (!e.category && r.category) e.category = r.category;
    e.sites.add(r.site);
    ent.set(r.entity, e);

    if (r.known) {
      const c = r.category || 'Other';
      cat.set(c, (cat.get(c) ?? 0) + 1);
    }

    const s = site.get(r.site) ?? { companies: new Set<string>(), count: 0 };
    s.companies.add(r.entity);
    s.count += 1;
    site.set(r.site, s);

    const d = new Date(r.ts).toISOString().slice(0, 10);
    day.set(d, (day.get(d) ?? 0) + 1);
  }

  const entities: EntityStat[] = [...ent.entries()]
    .map(([entity, v]) => ({ entity, count: v.count, known: v.known, category: v.category, sites: v.sites.size }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEvents: rows.length,
    knownEvents: rows.filter((r) => r.known).length,
    siteCount: site.size,
    entityCount: ent.size,
    entities,
    categories: [...cat.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    perSite: [...site.entries()]
      .map(([s, v]) => ({ site: s, companies: v.companies.size, count: v.count }))
      .sort((a, b) => b.companies - a.companies),
    daily: [...day.entries()].map(([d, count]) => ({ day: d, count })).sort((a, b) => a.day.localeCompare(b.day)),
  };
}

/** Interest categories inferred from site visits, for the Ad Profile section. */
export async function adProfileStats(): Promise<CategoryProfile[]> {
  const rows = await db.events.toArray();
  return computeProfile(rows.map((r) => ({ site: r.site, entity: r.entity, known: r.known })));
}

// ── Drill-down + export ────────────────────────────────────────────────────

export interface EntitySiteStat {
  site: string;
  count: number;
  firstTs: number;
  lastTs: number;
}

/** Detail for one company: which sites it tracked you on, and when. */
export async function entityDetail(
  entity: string,
): Promise<{ total: number; category?: string; sites: EntitySiteStat[] }> {
  const rows = await db.events.where('entity').equals(entity).toArray();
  const bySite = new Map<string, EntitySiteStat>();
  let category: string | undefined;
  for (const r of rows) {
    if (!category && r.category) category = r.category;
    const s = bySite.get(r.site) ?? { site: r.site, count: 0, firstTs: r.ts, lastTs: r.ts };
    s.count += 1;
    s.firstTs = Math.min(s.firstTs, r.ts);
    s.lastTs = Math.max(s.lastTs, r.ts);
    bySite.set(r.site, s);
  }
  return { total: rows.length, category, sites: [...bySite.values()].sort((a, b) => b.lastTs - a.lastTs) };
}

/** Detail for one site: which companies tracked you there. */
export async function siteDetail(site: string): Promise<EntityStat[]> {
  const rows = await db.events.where('site').equals(site).toArray();
  const byEntity = new Map<string, { count: number; known: boolean; category?: string }>();
  for (const r of rows) {
    const e = byEntity.get(r.entity) ?? { count: 0, known: r.known, category: r.category };
    e.count += 1;
    e.known = e.known || r.known;
    if (!e.category && r.category) e.category = r.category;
    byEntity.set(r.entity, e);
  }
  return [...byEntity.entries()]
    .map(([entity, v]) => ({ entity, count: v.count, known: v.known, category: v.category, sites: 1 }))
    .sort((a, b) => Number(b.known) - Number(a.known) || b.count - a.count);
}

/** Everything Datawake stores locally, for export. */
export async function exportAll(): Promise<{
  exportedAt: string;
  events: TrackEvent[];
  accounts: AccountEntry[];
  requests: RequestEntry[];
}> {
  const [events, accounts, requests] = await Promise.all([
    db.events.toArray(),
    db.accounts.toArray(),
    db.requests.toArray(),
  ]);
  return { exportedAt: new Date().toISOString(), events, accounts, requests };
}

// ── Violations ────────────────────────────────────────────────────────────

export async function recordViolation(v: Omit<ViolationEntry, 'id'>): Promise<void> {
  await db.violations.add(v);
}

export async function listViolations(): Promise<ViolationEntry[]> {
  return db.violations.orderBy('timestamp').reverse().toArray();
}

export async function clearViolations(): Promise<void> {
  await db.violations.clear();
}

// ── Footprint accounts ─────────────────────────────────────────────────────

export async function addAccount(a: Omit<AccountEntry, 'id'>): Promise<void> {
  await db.accounts.add(a);
}
export async function listAccounts(): Promise<AccountEntry[]> {
  return db.accounts.orderBy('addedAt').reverse().toArray();
}
export async function removeAccount(id: number): Promise<void> {
  await db.accounts.delete(id);
}

// ── GDPR requests ──────────────────────────────────────────────────────────

export async function addRequest(r: Omit<RequestEntry, 'id'>): Promise<number> {
  return db.requests.add(r as RequestEntry);
}
export async function listRequests(): Promise<RequestEntry[]> {
  return db.requests.orderBy('createdAt').reverse().toArray();
}
export async function updateRequest(id: number, patch: Partial<RequestEntry>): Promise<void> {
  await db.requests.update(id, { ...patch, updatedAt: Date.now() });
}
export async function removeRequest(id: number): Promise<void> {
  await db.requests.delete(id);
}

/** Wipe everything Datawake stores locally. */
export async function clearAllData(): Promise<void> {
  await Promise.all([db.events.clear(), db.accounts.clear(), db.requests.clear()]);
}
