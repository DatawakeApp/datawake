import data from './radar.generated.json';

interface RadarData {
  v: string;
  entities: string[];
  categories: string[];
  /** [entityIndex, categoryIndex, fingerprintingScore 0-3] */
  trackers: Record<string, [number, number, number?]>;
  owners: Record<string, number>;
}

// JSON import widens the tuples to number[]; cast through unknown.
const radar = data as unknown as RadarData;

export interface RadarHit {
  entity: string;
  category?: string;
}

/** A domain flagged as a tracker in the DuckDuckGo blocklist → parent company + human category. */
export function radarTracker(domain: string): RadarHit | null {
  const t = radar.trackers[domain];
  if (!t) return null;
  const cat = radar.categories[t[1]] || '';
  return { entity: radar.entities[t[0]], category: cat || undefined };
}

/** Broader ownership: who owns this domain, even if it isn't a flagged tracker. */
export function radarOwner(domain: string): string | null {
  const o = radar.owners[domain];
  return o === undefined ? null : radar.entities[o];
}

export type FingerprintScore = 0 | 1 | 2 | 3;

/**
 * Tracker Radar's fingerprinting score for a flagged tracker (0 = none … 3 = heavy), or null for
 * non-trackers. A prior only: Datawake claims fingerprinting only when it observes it.
 */
export function radarFingerprintScore(domain: string): FingerprintScore | null {
  const t = radar.trackers[domain];
  if (!t) return null;
  return (t[2] ?? 0) as FingerprintScore;
}

export const RADAR_VERSION: string = radar.v;
export const RADAR_HEAVY_FINGERPRINTER_COUNT = Object.values(radar.trackers).filter((t) => t[2] === 3).length;
export const RADAR_TRACKER_COUNT = Object.keys(radar.trackers).length;
