import { describe, it, expect } from 'vitest';
import { summarizeSites, filterSites, needsAttention } from '../lib/dashboard/sites';
import type { ActionEntry } from '../lib/storage/actions-summary';

const perSite = [
  { site: 'big.com', companies: 30, count: 50 },
  { site: 'cnn.com', companies: 12, count: 28 },
  { site: 'quiet.org', companies: 2, count: 3 },
  { site: 'spiegel.de', companies: 1, count: 1 },
];
const act = (kind: ActionEntry['kind'], site: string, timestamp: number): ActionEntry => ({ kind, site, timestamp });
const actions = [
  act('rejected', 'cnn.com', 100),
  act('violation', 'cnn.com', 110),
  act('payOrOk', 'spiegel.de', 200),
  act('rejected', 'big.com', 50),
  act('fingerprint', 'big.com', 60),
  act('rejected', 'nottracked.net', 300), // acted on, but no trackers recorded
];

describe('summarizeSites', () => {
  const rows = summarizeSites(perSite, actions);

  it('collects what happened on each site, most serious first', () => {
    expect(rows.find((r) => r.site === 'cnn.com')?.flags).toEqual(['violation', 'rejected']);
    expect(rows.find((r) => r.site === 'big.com')?.flags).toEqual(['fingerprint', 'rejected']);
    expect(rows.find((r) => r.site === 'quiet.org')?.flags).toEqual([]);
  });

  it('orders sites by their most serious event, then by companies', () => {
    expect(rows.map((r) => r.site)).toEqual(['cnn.com', 'spiegel.de', 'big.com', 'nottracked.net', 'quiet.org']);
  });

  it('includes sites Datawake acted on even without trackers', () => {
    expect(rows.find((r) => r.site === 'nottracked.net')).toMatchObject({ companies: 0, flags: ['rejected'] });
  });

  it('keeps the time of the latest action', () => {
    expect(rows.find((r) => r.site === 'cnn.com')?.lastActionAt).toBe(110);
    expect(rows.find((r) => r.site === 'quiet.org')?.lastActionAt).toBeNull();
  });
});

describe('filterSites', () => {
  const rows = summarizeSites(perSite, actions);
  it('filters by flag and by search text', () => {
    expect(filterSites(rows, 'violation', '').map((r) => r.site)).toEqual(['cnn.com']);
    expect(filterSites(rows, 'all', 'SPIE').map((r) => r.site)).toEqual(['spiegel.de']);
    expect(filterSites(rows, 'all', '')).toHaveLength(5);
  });
});

describe('needsAttention', () => {
  it('lists violations, pay walls and fingerprinting, newest first', () => {
    const rows = summarizeSites(perSite, actions);
    expect(needsAttention(rows, 5).map((r) => r.site)).toEqual(['spiegel.de', 'cnn.com', 'big.com']);
    expect(needsAttention(rows, 1)).toHaveLength(1);
  });
});
