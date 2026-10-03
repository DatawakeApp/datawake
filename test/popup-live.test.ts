import { describe, it, expect } from 'vitest';
import { ACTIVE_MS, isActive, groupByPurpose, activeEntities } from '../lib/popup/live';

const NOW = 1_800_000_000_000;
const e = (entity: string, category: string | undefined, domains: string[], known = true, count = 1) => ({ entity, category, domains, known, count });

describe('isActive', () => {
  const activity = { 'doubleclick.net': NOW - 2_000, 'old.com': NOW - ACTIVE_MS - 1 };
  it('is active when any of its domains was contacted recently', () => {
    expect(isActive(['x.com', 'doubleclick.net'], activity, NOW)).toBe(true);
  });
  it('is not active when only contacted long ago, or never', () => {
    expect(isActive(['old.com'], activity, NOW)).toBe(false);
    expect(isActive(['never.com'], activity, NOW)).toBe(false);
  });
});

describe('activeEntities', () => {
  it('counts companies sending requests right now', () => {
    const list = [e('Google', 'Advertising', ['doubleclick.net']), e('Old', 'Analytics', ['old.com'])];
    expect(activeEntities(list, { 'doubleclick.net': NOW - 1_000, 'old.com': NOW - 60_000 }, NOW)).toEqual(['Google']);
  });
});

describe('groupByPurpose', () => {
  const list = [
    e('Hotjar', 'Session replay', ['hotjar.com']),
    e('Google', 'Advertising', ['doubleclick.net'], true, 9),
    e('Criteo', 'Advertising', ['criteo.com'], true, 2),
    e('Chartbeat', 'Analytics', ['chartbeat.com']),
    e('Segment', 'Customer data', ['segment.io']),
    e('Meta', 'Social', ['facebook.net']),
    e('Fonts', 'Content', ['fonts.example']),
    e('mystery.io', undefined, ['mystery.io'], false),
  ];
  const groups = groupByPurpose(list, { 'criteo.com': NOW - 1_000 }, NOW);

  it('groups by what they do, most intrusive first, with plain titles', () => {
    expect(groups.map((g) => g.title)).toEqual([
      'Recording your screen',
      'Showing you ads',
      'Linking to your social accounts',
      'Watching what you do',
      'Other connections',
    ]);
  });

  it('puts companies active right now first, then the busiest', () => {
    expect(groups.find((g) => g.id === 'ads')?.entities.map((x) => x.entity)).toEqual(['Criteo', 'Google']);
  });

  it('keeps unrecognised domains at the end of Other connections', () => {
    expect(groups.at(-1)?.entities.map((x) => x.entity)).toEqual(['Fonts', 'mystery.io']);
  });

  it('merges analytics and customer data', () => {
    expect(groups.find((g) => g.id === 'watching')?.entities.map((x) => x.entity)).toEqual(['Chartbeat', 'Segment']);
  });

  it('leaves out empty groups', () => {
    expect(groupByPurpose([e('Google', 'Advertising', ['doubleclick.net'])], {}, NOW).map((g) => g.id)).toEqual(['ads']);
  });

  it('counts tag managers as watching what you do', () => {
    expect(groupByPurpose([e('Tealium', 'Tag manager', ['tiqcdn.com'])], {}, NOW).map((g) => g.id)).toEqual(['watching']);
  });
});
