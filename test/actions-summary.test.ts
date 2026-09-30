import { describe, it, expect } from 'vitest';
import { summarizeActions, type ActionEntry } from '../lib/storage/actions-summary';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const a = (kind: ActionEntry['kind'], site: string, daysAgo: number): ActionEntry => ({ kind, site, timestamp: NOW - daysAgo * DAY });

describe('summarizeActions', () => {
  const rows = [
    a('rejected', 'ara.cat', 1),
    a('rejected', 'lequipe.fr', 2),
    a('rejected', 'ara.cat', 3), // same site again: counts as another banner, one site
    a('payOrOk', 'spiegel.de', 1),
    a('fingerprint', 'ara.cat', 1),
    a('violation', 'abc.es', 5),
    a('rejected', 'old.example', 40), // outside a 30-day window
  ];

  it('counts each kind within the window', () => {
    const s = summarizeActions(rows, 30 * DAY, NOW);
    expect(s.rejected).toBe(3);
    expect(s.payOrOk).toBe(1);
    expect(s.fingerprint).toBe(1);
    expect(s.violation).toBe(1);
  });

  it('counts distinct sites Datawake acted on', () => {
    expect(summarizeActions(rows, 30 * DAY, NOW).sites).toBe(4);
  });

  it('includes everything with an all-time window', () => {
    expect(summarizeActions(rows, Number.MAX_SAFE_INTEGER, NOW).rejected).toBe(4);
  });

  it('is all zeros for no rows', () => {
    expect(summarizeActions([], 30 * DAY, NOW)).toEqual({ rejected: 0, payOrOk: 0, fingerprint: 0, violation: 0, sites: 0 });
  });
});
