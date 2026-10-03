import { describe, it, expect } from 'vitest';
import { matchTracker } from '../lib/trackers/match';

describe('matchTracker', () => {
  it('flags a known tracker with its parent entity', () => {
    const m = matchTracker('https://www.google-analytics.com/collect', 'https://nytimes.com/article');
    expect(m).not.toBeNull();
    expect(m!.known).toBe(true);
    expect(m!.entity).toBe('Google (Alphabet)');
  });

  it('resolves subdomains to the registrable tracker domain', () => {
    const m = matchTracker('https://stats.g.doubleclick.net/measure', 'https://example.com');
    expect(m?.trackerDomain).toBe('doubleclick.net');
    expect(m?.entity).toBe('Google (Alphabet)');
  });

  it('returns null for first-party requests', () => {
    const m = matchTracker('https://api.example.com/data', 'https://www.example.com/page');
    expect(m).toBeNull();
  });

  it('marks unknown third parties as not known, entity = domain', () => {
    const m = matchTracker('https://some-random-cdn.io/a.js', 'https://example.com');
    expect(m?.known).toBe(false);
    expect(m?.entity).toBe('some-random-cdn.io');
  });

  it('ignores non-http requests', () => {
    expect(matchTracker('data:text/javascript,1', 'https://example.com')).toBeNull();
    expect(matchTracker('chrome-extension://abc/x.js', 'https://example.com')).toBeNull();
  });

  it('names essential third parties (payments/infra) but does not count them as tracking', () => {
    // Stripe is recognized and named, but must not count as tracking-you
    // (otherwise it would penalize the score and trip false-positive violations).
    const stripe = matchTracker('https://js.stripe.com/v3', 'https://shop.example.com');
    expect(stripe?.entity).toBe('Stripe');
    expect(stripe?.known).toBe(false);
    expect(stripe?.category).toBeUndefined();

    // gstatic is Google's static/font CDN, named under Google, not a tracker.
    const gstatic = matchTracker('https://fonts.gstatic.com/x.woff2', 'https://example.com');
    expect(gstatic?.known).toBe(false);
  });

  it('treats essential companies as non-tracking across all their domains (entity-level)', () => {
    // A Sentry domain not in the curated list still must not count as tracking.
    const sentryCdn = matchTracker('https://browser.sentry-cdn.com/x.js', 'https://shop.example.com');
    expect(sentryCdn?.entity).toBe('Sentry');
    expect(sentryCdn?.known).toBe(false);
  });

  it('classifies known ad-tech with a category instead of falling to "Other"', () => {
    const inmobi = matchTracker('https://cdn.inmobi.com/x.js', 'https://example.com');
    expect(inmobi?.known).toBe(true);
    expect(inmobi?.category).toBe('Advertising');
  });

  it.each([
    ['zeotap.com', 'Customer data'],
    ['seedtag.com', 'Advertising'],
    ['sparteo.com', 'Advertising'],
    ['dotmetrics.net', 'Analytics'],
    ['anonymised.io', 'Advertising'],
  ])('fills in a category the tracker data leaves out: %s', (domain, category) => {
    const m = matchTracker(`https://${domain}/x.js`, 'https://example.com');
    expect(m?.known).toBe(true);
    expect(m?.category).toBe(category);
  });

  it('gives Seedtag its normal name', () => {
    expect(matchTracker('https://seedtag.com/x.js', 'https://example.com')?.entity).toBe('Seedtag');
  });

  it('treats consent tools like Didomi as essential, not tracking', () => {
    const m = matchTracker('https://sdk.privacy-center.org/x.js', 'https://example.com');
    expect(m?.entity).toBe('Didomi');
    expect(m?.known).toBe(false);
  });
});

