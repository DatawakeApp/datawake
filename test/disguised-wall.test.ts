import { describe, it, expect } from 'vitest';
import { isDisguisedWallRedirect, addWallSite, removeWallSite, MAX_WALL_SITES } from '../lib/cmp/disguised-wall';

describe('isDisguisedWallRedirect', () => {
  const base = { fromSite: 'lefigaro.fr', msSinceReject: 1500 };

  it('flags a jump to a subscription page right after Reject', () => {
    expect(isDisguisedWallRedirect({ ...base, toUrl: 'https://abonnement.lefigaro.fr/?redirect=x' })).toBe(true);
    expect(isDisguisedWallRedirect({ ...base, fromSite: 'example.de', toUrl: 'https://example.de/abo/angebote' })).toBe(true);
    expect(isDisguisedWallRedirect({ ...base, fromSite: 'news.com', toUrl: 'https://news.com/subscribe?ref=cmp' })).toBe(true);
    expect(isDisguisedWallRedirect({ ...base, fromSite: 'diario.es', toUrl: 'https://suscripcion.diario.es/' })).toBe(true);
  });

  it('ignores ordinary navigation', () => {
    expect(isDisguisedWallRedirect({ ...base, toUrl: 'https://www.lefigaro.fr/politique/article' })).toBe(false);
  });

  it('ignores navigation long after Reject (the user clicked something)', () => {
    expect(isDisguisedWallRedirect({ ...base, msSinceReject: 30_000, toUrl: 'https://abonnement.lefigaro.fr/' })).toBe(false);
  });

  it('ignores subscription pages on unrelated sites', () => {
    expect(isDisguisedWallRedirect({ ...base, toUrl: 'https://www.youtube.com/subscribe' })).toBe(false);
  });

  it('ignores words that only contain the keyword', () => {
    expect(isDisguisedWallRedirect({ ...base, toUrl: 'https://www.lefigaro.fr/about-us' })).toBe(false);
    expect(isDisguisedWallRedirect({ ...base, toUrl: 'https://www.lefigaro.fr/abonnes-du-jour' })).toBe(false);
  });

  it('is false for unparsable urls', () => {
    expect(isDisguisedWallRedirect({ ...base, toUrl: 'not a url' })).toBe(false);
  });
});

describe('addWallSite', () => {
  it('adds without mutating', () => {
    const list = ['a.com'];
    expect(addWallSite(list, 'b.com')).toEqual(['a.com', 'b.com']);
    expect(list).toEqual(['a.com']);
  });

  it('does not duplicate', () => {
    expect(addWallSite(['a.com'], 'a.com')).toEqual(['a.com']);
  });

  it('keeps the most recent sites when full', () => {
    const full = Array.from({ length: MAX_WALL_SITES }, (_, i) => `s${i}.com`);
    const next = addWallSite(full, 'new.com');
    expect(next).toHaveLength(MAX_WALL_SITES);
    expect(next.at(-1)).toBe('new.com');
    expect(next[0]).toBe('s1.com');
  });
});

describe('removeWallSite', () => {
  it('removes without mutating', () => {
    const list = ['a.com', 'b.com'];
    expect(removeWallSite(list, 'a.com')).toEqual(['b.com']);
    expect(list).toEqual(['a.com', 'b.com']);
  });
});
