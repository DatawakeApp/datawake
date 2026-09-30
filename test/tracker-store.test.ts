import { describe, it, expect } from 'vitest';
import { TrackerStore } from '../lib/detection/tracker-store';
import type { TrackerMatch } from '../lib/trackers/match';

const mk = (entity: string, domain: string, known = true, category?: string): TrackerMatch => ({
  trackerDomain: domain,
  entity,
  known,
  category,
});

describe('TrackerStore', () => {
  it('aggregates per entity and counts requests + distinct domains', () => {
    const s = new TrackerStore();
    s.startPage(1, 'nytimes.com');
    s.record(1, mk('Google (Alphabet)', 'doubleclick.net', true, 'Advertising'));
    s.record(1, mk('Google (Alphabet)', 'google-analytics.com', true, 'Analytics'));
    s.record(1, mk('Google (Alphabet)', 'doubleclick.net', true, 'Advertising'));

    const g = s.getForTab(1).entities.find((e) => e.entity === 'Google (Alphabet)')!;
    expect(g.count).toBe(3);
    expect(g.domains.length).toBe(2);
    expect(s.getForTab(1).knownCount).toBe(1);
  });

  it('separates known trackers from other third parties, known first', () => {
    const s = new TrackerStore();
    s.startPage(1, 'site.com');
    s.record(1, mk('somecdn.io', 'somecdn.io', false));
    s.record(1, mk('Tracker A', 'a.com', true));

    const v = s.getForTab(1);
    expect(v.knownCount).toBe(1);
    expect(v.otherDomainCount).toBe(1);
    expect(v.entities[0].known).toBe(true);
  });

  it('survives a snapshot/load round-trip (persistence)', () => {
    const s = new TrackerStore();
    s.startPage(7, 'x.com');
    s.record(7, mk('Meta', 'facebook.net', true, 'Advertising'));

    const restored = new TrackerStore();
    restored.loadSnapshot(s.snapshot());

    const v = restored.getForTab(7);
    expect(v.site).toBe('x.com');
    expect(v.entities[0].entity).toBe('Meta');
    expect(v.knownCount).toBe(1);
  });
});
