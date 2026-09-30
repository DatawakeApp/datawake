import { describe, it, expect } from 'vitest';
import { radarTracker, radarOwner, radarFingerprintScore, RADAR_TRACKER_COUNT } from '../lib/trackers/radar';

describe('Tracker Radar dataset', () => {
  it('bundles the full tracker list', () => {
    expect(RADAR_TRACKER_COUNT).toBeGreaterThan(900);
  });

  it('resolves a well-known tracker to a parent entity + category', () => {
    const hit = radarTracker('doubleclick.net');
    expect(hit).not.toBeNull();
    expect(hit!.entity.length).toBeGreaterThan(0);
  });

  it('returns null for a domain that is not a tracker', () => {
    expect(radarTracker('not-a-real-tracker-xyz.example')).toBeNull();
  });

  it('knows broad ownership for common domains', () => {
    const owner = radarOwner('google-analytics.com');
    expect(owner && /google/i.test(owner)).toBeTruthy();
  });

  it('exposes the Tracker Radar fingerprinting score (0-3) for flagged trackers', () => {
    const score = radarFingerprintScore('doubleclick.net');
    expect(score).not.toBeNull();
    expect([0, 1, 2, 3]).toContain(score);
  });

  it('flags a meaningful set of heavy (score 3) fingerprinters', async () => {
    const { RADAR_HEAVY_FINGERPRINTER_COUNT } = await import('../lib/trackers/radar');
    expect(RADAR_HEAVY_FINGERPRINTER_COUNT).toBeGreaterThan(100);
  });

  it('returns null for non-trackers', () => {
    expect(radarFingerprintScore('not-a-real-tracker-xyz.example')).toBeNull();
  });
});
