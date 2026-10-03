/** Tracker Radar categories to Datawake's plain categories (used when building the tracker data). */

/**
 * Radar tags any script that uses replay-like APIs as "Session Replay", including CDNs and ad tech.
 * "Recording your screen" is a strong claim, so only products built for it get that label.
 */
const REPLAY_DOMAINS = new Set([
  'hotjar.com', 'hotjar.io', 'fullstory.com', 'mouseflow.com', 'contentsquare.net', 'crazyegg.com',
  'clarity.ms', 'webvisor.org', 'smartlook.com', 'logrocket.com', 'lr-ingest.io', 'luckyorange.com',
  'luckyorange.net', 'inspectlet.com', 'quantummetric.com',
]);

/** Most telling first: a domain that does several things is labelled by the most intrusive. */
const PRIORITY: ReadonlyArray<[string, string]> = [
  ['Social Network', 'Social'],
  ['Social - Share', 'Social'],
  ['Social - Comment', 'Social'],
  ['Social - Relationship', 'Social'],
  ['Advertising', 'Advertising'],
  ['Ad Motivated Tracking', 'Advertising'],
  ['Action Pixels', 'Advertising'],
  ['Ad Fraud', 'Advertising'],
  ['Analytics', 'Analytics'],
  ['Audience Measurement', 'Analytics'],
  ['Third-Party Analytics Marketing', 'Analytics'],
  ['Support Chat Widget', 'Customer data'],
  ['Tag Manager', 'Tag manager'],
  ['Content Delivery', 'Content'],
  ['Embedded Content', 'Content'],
];

export function humanCategory(cats: readonly string[] | undefined, domain = ''): string {
  if (REPLAY_DOMAINS.has(domain)) return 'Session replay';
  if (!cats || cats.length === 0) return '';
  for (const [radar, ours] of PRIORITY) if (cats.includes(radar)) return ours;
  return 'Other';
}

/** Domains with no category take their owner's most common real category. */
export function fillFromOwner<T extends { owner: string; category: string }>(rows: readonly T[]): T[] {
  const tally = new Map<string, Map<string, number>>();
  for (const r of rows) {
    // Never spread "recording your screen" to a company's other domains.
    if (!r.category || r.category === 'Other' || r.category === 'Session replay') continue;
    const t = tally.get(r.owner) ?? new Map<string, number>();
    t.set(r.category, (t.get(r.category) ?? 0) + 1);
    tally.set(r.owner, t);
  }
  const best = (owner: string): string => {
    const t = tally.get(owner);
    if (!t) return '';
    return [...t.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };
  return rows.map((r) => (r.category ? r : { ...r, category: best(r.owner) }));
}
