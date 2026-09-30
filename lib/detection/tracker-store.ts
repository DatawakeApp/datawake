import type { TrackerMatch } from '../trackers/match';

export interface EntityAggregate {
  entity: string;
  known: boolean;
  category?: string;
  count: number;
  /** Distinct tracker domains attributed to this entity on the page. */
  domains: string[];
}

export interface ViolationRecord {
  /** Tracking cookies set after the user's consent was rejected. */
  newCookies: Array<{ name: string; domain: string }>;
  detectedAt: number;
}

export interface TabTrackers {
  /** Registrable domain of the page, e.g. "nytimes.com". */
  site: string | null;
  /** Known entities first, then by request count. */
  entities: EntityAggregate[];
  /** Distinct recognized companies. */
  knownCount: number;
  /** Distinct unrecognized third-party domains. */
  otherDomainCount: number;
  /** Set when a site ignored the user's Reject click and set tracking cookies anyway. */
  violation?: ViolationRecord | null;
}

/** Plain, serializable snapshot of one tab (for persistence across SW restarts). */
export interface SerializedTab {
  site: string | null;
  entities: EntityAggregate[];
  seen: string[];
}

interface TabState {
  site: string | null;
  byEntity: Map<string, EntityAggregate>;
  seenDomains: Set<string>;
}

/**
 * In-memory, per-tab aggregation of tracker hits. Lives in the service worker.
 * Pure (no browser/storage deps) so it is trivially unit-testable; persistence is layered
 * on top in the background via snapshot()/loadSnapshot().
 */
export class TrackerStore {
  private tabs = new Map<number, TabState>();

  private ensure(tabId: number, site: string | null = null): TabState {
    let tab = this.tabs.get(tabId);
    if (!tab) {
      tab = { site, byEntity: new Map(), seenDomains: new Set() };
      this.tabs.set(tabId, tab);
    }
    return tab;
  }

  startPage(tabId: number, site: string | null): void {
    this.tabs.set(tabId, { site, byEntity: new Map(), seenDomains: new Set() });
  }

  setSite(tabId: number, site: string | null): void {
    this.ensure(tabId).site = site;
  }

  /** Record one matched request. Returns true if this (tab, trackerDomain) pair is newly seen. */
  record(tabId: number, match: TrackerMatch): boolean {
    const tab = this.ensure(tabId);
    const firstSeen = !tab.seenDomains.has(match.trackerDomain);
    tab.seenDomains.add(match.trackerDomain);

    let agg = tab.byEntity.get(match.entity);
    if (!agg) {
      agg = { entity: match.entity, known: match.known, category: match.category, count: 0, domains: [] };
      tab.byEntity.set(match.entity, agg);
    }
    agg.count += 1;
    if (match.known) agg.known = true; // upgrade if any source flagged it a tracker
    if (!agg.category && match.category) agg.category = match.category;
    if (!agg.domains.includes(match.trackerDomain)) agg.domains.push(match.trackerDomain);
    return firstSeen;
  }

  getForTab(tabId: number): TabTrackers {
    const tab = this.tabs.get(tabId);
    if (!tab) return { site: null, entities: [], knownCount: 0, otherDomainCount: 0 };

    const entities = [...tab.byEntity.values()].sort((a, b) => {
      if (a.known !== b.known) return a.known ? -1 : 1; // recognized companies first
      return b.count - a.count;
    });

    return {
      site: tab.site,
      entities,
      knownCount: entities.filter((e) => e.known).length,
      otherDomainCount: entities.filter((e) => !e.known).length,
    };
  }

  clearTab(tabId: number): void {
    this.tabs.delete(tabId);
  }

  /** Serialize all tabs for storage.session. */
  snapshot(): Record<number, SerializedTab> {
    const out: Record<number, SerializedTab> = {};
    for (const [tabId, tab] of this.tabs) {
      out[tabId] = { site: tab.site, entities: [...tab.byEntity.values()], seen: [...tab.seenDomains] };
    }
    return out;
  }

  /** Restore tabs from a snapshot (used on service-worker startup). */
  loadSnapshot(data: Record<number, SerializedTab> | null | undefined): void {
    if (!data) return;
    for (const [k, t] of Object.entries(data)) {
      const byEntity = new Map<string, EntityAggregate>();
      for (const e of t.entities) byEntity.set(e.entity, e);
      this.tabs.set(Number(k), { site: t.site, byEntity, seenDomains: new Set(t.seen) });
    }
  }
}
