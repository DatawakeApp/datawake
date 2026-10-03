/**
 * "What is tracking you here, right now": groups the page's companies by what they do, and marks
 * the ones still sending requests. Pure, so the popup stays a thin view.
 */

/** A company counts as active if one of its domains was contacted this recently. */
export const ACTIVE_MS = 15_000;

/** Last request time per tracker domain on this tab (from the background). */
export type Activity = Readonly<Record<string, number>>;

interface PageEntity {
  entity: string;
  category?: string;
  known: boolean;
  count: number;
  domains: string[];
}

export type PurposeId = 'replay' | 'ads' | 'social' | 'watching' | 'other';

export interface PurposeGroup<T extends PageEntity> {
  id: PurposeId;
  title: string;
  entities: T[];
}

const GROUPS: ReadonlyArray<{ id: PurposeId; title: string }> = [
  { id: 'replay', title: 'Recording your screen' },
  { id: 'ads', title: 'Showing you ads' },
  { id: 'social', title: 'Linking to your social accounts' },
  { id: 'watching', title: 'Watching what you do' },
  { id: 'other', title: 'Other connections' },
];

const PURPOSE: Record<string, PurposeId> = {
  'Session replay': 'replay',
  Advertising: 'ads',
  Social: 'social',
  Analytics: 'watching',
  'Customer data': 'watching',
};

export function isActive(domains: readonly string[], activity: Activity, now: number): boolean {
  return domains.some((d) => {
    const at = activity[d];
    return at !== undefined && now - at <= ACTIVE_MS;
  });
}

export function activeEntities(list: readonly PageEntity[], activity: Activity, now: number): string[] {
  return list.filter((e) => e.known && isActive(e.domains, activity, now)).map((e) => e.entity);
}

export function groupByPurpose<T extends PageEntity>(list: readonly T[], activity: Activity, now: number): PurposeGroup<T>[] {
  const purposeOf = (e: T): PurposeId => (e.known ? PURPOSE[e.category ?? ''] ?? 'other' : 'other');
  const rank = (e: T): number => (isActive(e.domains, activity, now) ? 0 : 1);
  return GROUPS.map((g) => ({
    ...g,
    entities: list
      .filter((e) => purposeOf(e) === g.id)
      .sort((a, b) => Number(b.known) - Number(a.known) || rank(a) - rank(b) || b.count - a.count),
  })).filter((g) => g.entities.length > 0);
}
