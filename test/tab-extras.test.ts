import { describe, it, expect } from 'vitest';
import { snapshotTabExtras, restoreTabExtras } from '../lib/detection/tab-extras';
import type { ViolationRecord } from '../lib/detection/tracker-store';

const violation: ViolationRecord = { newCookies: [{ name: 'IDE', domain: '.doubleclick.net' }], detectedAt: 1_700_000_000_000 };

describe('tab extras snapshot', () => {
  it('round-trips violations, vendor counts and pay-or-OK flags (survives a service-worker restart)', () => {
    const snap = snapshotTabExtras(new Map([[7, violation], [8, null]]), new Map([[7, 1219], [9, 60]]), new Set([9]));
    const json = JSON.parse(JSON.stringify(snap)); // storage is JSON-like
    const restored = restoreTabExtras(json);
    expect(restored.violations.get(7)).toEqual(violation);
    expect(restored.violations.has(8)).toBe(false); // null placeholders aren't persisted
    expect(restored.tcfCounts.get(7)).toBe(1219);
    expect(restored.tcfCounts.get(9)).toBe(60);
    expect(restored.payOrOk.has(9)).toBe(true);
    expect(restored.payOrOk.has(7)).toBe(false);
  });

  it('restores empty state from missing or malformed storage, never throws', () => {
    for (const bad of [undefined, null, 42, 'x', { violations: 'nope', tcfCounts: [1], payOrOk: {} }]) {
      const r = restoreTabExtras(bad);
      expect(r.violations.size + r.tcfCounts.size + r.payOrOk.size).toBe(0);
    }
  });

  it('drops malformed entries but keeps valid ones', () => {
    const r = restoreTabExtras({
      violations: { 1: violation, 2: { newCookies: 'bad' }, x: violation },
      tcfCounts: { 3: 100, 4: 'many', 5: -1 },
      payOrOk: [6, 'seven', 8.5],
    });
    expect([...r.violations.keys()]).toEqual([1]);
    expect([...r.tcfCounts.entries()]).toEqual([[3, 100]]);
    expect([...r.payOrOk]).toEqual([6]);
  });

  it('round-trips fingerprint findings and drops malformed ones', () => {
    const finding = {
      domain: 'fpjs.example', company: 'FingerprintJS', firstParty: false, purpose: 'other' as const,
      techniques: ['canvas', 'audio'] as const, firstSeenAt: 5, afterReject: true,
    };
    const snap = snapshotTabExtras(new Map(), new Map(), new Set(), new Map([[3, [{ ...finding, techniques: [...finding.techniques] }]]]));
    const restored = restoreTabExtras(JSON.parse(JSON.stringify(snap)));
    expect(restored.fingerprints.get(3)).toEqual([{ ...finding, techniques: ['canvas', 'audio'] }]);

    const bad = restoreTabExtras({ fingerprints: { 4: [{ domain: 7 }], 5: 'x', 6: [{ ...finding, techniques: ['telepathy'] }] } });
    expect(bad.fingerprints.size).toBe(0);
  });

  it('restores findings saved before `purpose` existed as purpose "other"', () => {
    const old = { domain: 'a.example', company: null, firstParty: false, techniques: ['canvas'], firstSeenAt: 1, afterReject: false };
    const r = restoreTabExtras({ fingerprints: { 2: [old] } });
    expect(r.fingerprints.get(2)?.[0].purpose).toBe('other');
  });

  it('round-trips when the banner was rejected on each tab (so the popup can say so)', () => {
    const snap = snapshotTabExtras(new Map(), new Map(), new Set(), new Map(), new Map([[4, 1_700_000_000_000]]));
    const r = restoreTabExtras(JSON.parse(JSON.stringify(snap)));
    expect(r.rejectedAt.get(4)).toBe(1_700_000_000_000);
    expect(restoreTabExtras({ rejectedAt: { 5: 'yesterday', x: 3 } }).rejectedAt.size).toBe(0);
  });
});
