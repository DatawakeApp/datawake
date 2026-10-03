import { describe, it, expect } from 'vitest';
import { AUTHORITIES, authorityFor, guessCountry, FIND_AUTHORITY_URL } from '../lib/complaint/authorities';
import { buildComplaint, evidenceFile } from '../lib/complaint/complaint';

const TS = Date.UTC(2026, 9, 1, 14, 7);
const violation = {
  site: 'news.example',
  url: 'https://www.news.example/article?id=1',
  timestamp: TS,
  newCookies: [
    { name: '_ga', domain: '.google-analytics.com' },
    { name: 'IDE', domain: '.doubleclick.net' },
    { name: '_fbp', domain: '.facebook.com' },
  ],
  fingerprinters: ['FingerprintJS'],
};

describe('authorities', () => {
  it('has an https complaint link for every country', () => {
    for (const a of AUTHORITIES) expect(a.url, a.country).toMatch(/^https:\/\//);
  });

  it('finds the authority by country code', () => {
    expect(authorityFor('FR')?.name).toMatch(/CNIL/);
    expect(authorityFor('es')?.name).toMatch(/AEPD|Agencia/);
    expect(authorityFor('ZZ')).toBeNull();
  });

  it('marks the UK as UK GDPR and PECR', () => {
    expect(authorityFor('GB')?.law).toBe('uk');
  });

  it('guesses the country from the browser language region', () => {
    expect(guessCountry(['es-ES', 'en'])).toBe('ES');
    expect(guessCountry(['en-GB'])).toBe('GB');
    expect(guessCountry(['en-US', 'de'])).toBeNull();
    expect(guessCountry(['de'])).toBeNull();
  });

  it('has a fallback to find any authority', () => {
    expect(FIND_AUTHORITY_URL).toMatch(/^https:\/\/www\.edpb\.europa\.eu/);
  });
});

describe('buildComplaint', () => {
  const fr = authorityFor('FR')!;
  const c = buildComplaint(violation, fr, { name: 'Jane Doe', email: 'jane@example.com' });

  it('names the site and the authority', () => {
    expect(c.subject).toContain('news.example');
    expect(c.body).toContain(fr.name);
    expect(c.body).toContain('https://www.news.example/article?id=1');
  });

  it('lists the evidence: cookies grouped by company, and fingerprinting', () => {
    expect(c.body).toContain('3 tracking cookies');
    expect(c.body).toMatch(/Google[^\n]*_ga/);
    expect(c.body).toContain('_fbp');
    expect(c.body).toContain('FingerprintJS');
  });

  it('is honest that the extension refused on the user\'s behalf', () => {
    expect(c.body).toMatch(/on my behalf/);
  });

  it('cites the EU rules, or UK rules for the ICO', () => {
    expect(c.body).toContain('Article 5(3)');
    const uk = buildComplaint(violation, authorityFor('GB')!, { name: 'Jane Doe', email: 'jane@example.com' });
    expect(uk.body).toContain('PECR');
    expect(uk.body).not.toContain('Article 5(3) of the ePrivacy Directive');
  });

  it('signs with the user, or leaves placeholders', () => {
    expect(c.body).toContain('Jane Doe');
    expect(buildComplaint(violation, fr, { name: '', email: '' }).body).toContain('[Your name]');
  });

  it('handles fingerprint-only and cookie-only violations', () => {
    const fpOnly = buildComplaint({ ...violation, newCookies: [] }, fr, { name: '', email: '' });
    expect(fpOnly.subject).toMatch(/fingerprint/i);
    expect(fpOnly.body).not.toContain('tracking cookies');
    const ckOnly = buildComplaint({ ...violation, fingerprinters: [] }, fr, { name: '', email: '' });
    expect(ckOnly.body).not.toMatch(/fingerprint/i);
  });

  it('uses no em dashes', () => {
    expect(c.body).not.toMatch(/—/);
  });
});

describe('evidenceFile', () => {
  it('is a plain JSON record of the violation', () => {
    const json = JSON.parse(evidenceFile(violation));
    expect(json.site).toBe('news.example');
    expect(json.detectedAt).toBe(new Date(TS).toISOString());
    expect(json.cookiesSetAfterReject).toHaveLength(3);
    expect(json.fingerprintingAfterReject).toEqual(['FingerprintJS']);
    expect(json.recordedBy).toMatch(/Datawake/);
  });
});

describe('German complaints', () => {
  it('address the state authority in the first person', () => {
    const c = buildComplaint(violation, authorityFor('DE')!, { name: '', email: '' });
    expect(c.body).toMatch(/^To the data protection authority of my federal state,/);
  });
});
