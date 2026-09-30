import { describe, it, expect } from 'vitest';
import { splitCookiesBySite } from '../lib/cookies/split';

const c = (name: string, domain: string) => ({ name, session: false, domain });

describe('splitCookiesBySite', () => {
  it("separates this site's own cookies from tracker cookies (which build up across all sites)", () => {
    const { own, trackers } = splitCookiesBySite(
      [c('lang', 'www.ara.cat'), c('sess', '.ara.cat'), c('IDE', '.doubleclick.net'), c('_fbp', '.facebook.com')],
      'ara.cat',
    );
    expect(own.map((x) => x.name)).toEqual(['lang', 'sess']);
    expect(trackers.map((x) => x.name)).toEqual(['IDE', '_fbp']);
  });

  it('treats cookies without a domain as the site’s own', () => {
    expect(splitCookiesBySite([{ name: 'x', session: true }], 'ara.cat').own).toHaveLength(1);
  });

  it('puts everything under the site when the site is unknown', () => {
    const r = splitCookiesBySite([c('IDE', '.doubleclick.net')], null);
    expect(r.own).toHaveLength(1);
    expect(r.trackers).toHaveLength(0);
  });
});
