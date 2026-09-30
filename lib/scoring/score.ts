import type { EntityAggregate } from '../detection/tracker-store';
import { dataFlow } from '../brokers/flows';

export interface SiteScore {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number; // 0-100
  color: string;
  label: string;
  trackerCount: number;
  highRiskCount: number;
}

const CATEGORY_PENALTY: Record<string, number> = {
  'Session replay': 22,
  Advertising: 9,
  Social: 12,
  Analytics: 4,
  'Customer data': 7,
  Content: 1,
  Other: 2,
};

/** Per script domain observed fingerprinting the device (lib/fingerprint), cookie-less tracking. */
export const FINGERPRINT_PENALTY = 15;

export interface ScoreSignals {
  /** Distinct script domains observed fingerprinting on this page. */
  fingerprintingDomains?: number;
}

export function siteScore(entities: EntityAggregate[], signals: ScoreSignals = {}): SiteScore {
  const known = entities.filter((e) => e.known);
  const fingerprinting = signals.fingerprintingDomains ?? 0;
  let penalty = fingerprinting * FINGERPRINT_PENALTY;
  for (const e of known) {
    penalty += CATEGORY_PENALTY[e.category ?? 'Other'] ?? 2;
    const f = dataFlow(e.entity);
    if (f?.sharing === 'sells') penalty += 12;
  }
  const score = Math.max(0, 100 - penalty);
  const grade: SiteScore['grade'] =
    score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';
  const color =
    grade === 'A'
      ? '#5bd6a5'
      : grade === 'B'
        ? '#7dd4ab'
        : grade === 'C'
          ? '#f1c40f'
          : grade === 'D'
            ? '#ffb066'
            : '#f1707a';
  const highRiskCount = known.filter(
    (e) =>
      e.category === 'Session replay' ||
      e.category === 'Social' ||
      dataFlow(e.entity)?.sharing === 'sells',
  ).length;
  const hasSessionReplay = known.some((e) => e.category === 'Session replay');
  const label = hasSessionReplay
    ? 'Session recording'
    : fingerprinting > 0
      ? 'Fingerprinting'
      : grade === 'A'
      ? 'Clean'
      : grade === 'B'
        ? 'Light tracking'
        : grade === 'C'
          ? 'Moderate tracking'
          : grade === 'D'
            ? 'Heavy tracking'
            : 'Very invasive';
  return { grade, score, color, label, trackerCount: known.length, highRiskCount };
}
