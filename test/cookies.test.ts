import { describe, it, expect } from 'vitest';
import { categorizeCookies, isNonViolationCookie } from '../lib/cookies/categorize';

const cat = (name: string): string => categorizeCookies([{ name, session: false }])[0].category;

describe('categorizeCookies', () => {
  it('flags real tracking cookies', () => {
    expect(cat('_ga')).toBe('tracking');
    expect(cat('_ga_ABC123')).toBe('tracking');
    expect(cat('_fbp')).toBe('tracking');
    expect(cat('_hjSessionUser_123')).toBe('tracking'); // _hj prefix
    expect(cat('IDE')).toBe('tracking'); // exact
    expect(cat('fr')).toBe('tracking'); // exact (Meta)
  });

  it('does NOT mislabel functional cookies that merely start with a tracking token', () => {
    // These previously matched over-broad prefixes like ^SID / ^IDE / ^fr.
    expect(cat('SIDEBAR_STATE')).not.toBe('tracking');
    expect(cat('IDENTITY')).not.toBe('tracking');
    expect(cat('friends_count')).not.toBe('tracking');
    expect(cat('frame_id')).not.toBe('tracking');
  });

  it('categorizes session and functional cookies', () => {
    expect(cat('PHPSESSID')).toBe('session');
    expect(cat('csrftoken')).toBe('session');
    expect(cat('lang')).toBe('functional');
    expect(cat('CookieConsent')).toBe('functional');
  });

  it('classifies a cookie on a known tracker domain as tracking, whatever its name', () => {
    // Random opaque name that no name-pattern would catch, but the domain is a tracker.
    const c = categorizeCookies([{ name: 'x9f2', session: false, domain: '.doubleclick.net' }])[0];
    expect(c.category).toBe('tracking');
    // Same opaque name on a first-party/non-tracker domain stays "other".
    const c2 = categorizeCookies([{ name: 'x9f2', session: false, domain: '.myshop.example' }])[0];
    expect(c2.category).toBe('other');
  });
});

describe('isNonViolationCookie', () => {
  it('excludes consent records, opt-outs, security and functional cookies', () => {
    expect(isNonViolationCookie('euconsent-v2')).toBe(true);
    expect(isNonViolationCookie('OptanonConsent')).toBe(true);
    expect(isNonViolationCookie('notice_gdpr_prefs')).toBe(true);
    expect(isNonViolationCookie('usprivacy')).toBe(true);
    expect(isNonViolationCookie('__cf_bm')).toBe(true); // Cloudflare anti-bot
    expect(isNonViolationCookie('datadome')).toBe(true);
    expect(isNonViolationCookie('PHPSESSID')).toBe(true);
    expect(isNonViolationCookie('lang')).toBe(true);
  });

  it('excludes cookie-support probes, which carry no identifier (seen live on corriere.it)', () => {
    expect(isNonViolationCookie('test_cookie')).toBe(true); // DoubleClick "can I set cookies?"
    expect(isNonViolationCookie('testcookie')).toBe(true);
  });

  it('still counts genuine tracking cookies as violations', () => {
    expect(isNonViolationCookie('_ga')).toBe(false);
    expect(isNonViolationCookie('_fbp')).toBe(false);
    expect(isNonViolationCookie('IDE')).toBe(false);
  });
});
