import { describe, it, expect } from 'vitest';
import { siteScore, FINGERPRINT_PENALTY } from '../lib/scoring/score';
import type { EntityAggregate } from '../lib/detection/tracker-store';

const entity = (name: string, category: string): EntityAggregate => ({
  entity: name, category, known: true, domains: [`${name.toLowerCase()}.example`], count: 1,
});

describe('siteScore with fingerprinting', () => {
  const two = [entity('Adco', 'Analytics'), entity('Stats', 'Analytics')];

  it('is unchanged without fingerprinting (backwards compatible)', () => {
    expect(siteScore(two).score).toBe(siteScore(two, { fingerprintingDomains: 0 }).score);
  });

  it('penalises each fingerprinting domain', () => {
    const base = siteScore(two).score;
    expect(siteScore(two, { fingerprintingDomains: 2 }).score).toBe(base - 2 * FINGERPRINT_PENALTY);
  });

  it('labels the site "Fingerprinting", even with no known trackers', () => {
    const s = siteScore([], { fingerprintingDomains: 1 });
    expect(s.label).toBe('Fingerprinting');
    expect(s.score).toBe(100 - FINGERPRINT_PENALTY);
  });

  it('keeps "Session recording" as the higher-priority label', () => {
    expect(siteScore([entity('Hotjar', 'Session replay')], { fingerprintingDomains: 1 }).label).toBe('Session recording');
  });

  it('only calls a page clean when nothing tracks you', () => {
    expect(siteScore([]).label).toBe('Clean');
    expect(siteScore([entity('Google (Alphabet)', 'Advertising')]).label).not.toBe('Clean');
  });
});
