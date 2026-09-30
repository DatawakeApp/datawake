import { describe, it, expect } from 'vitest';
import { fingerprintPurpose } from '../lib/fingerprint/purpose';
import { addFpReport, type FpContext } from '../lib/fingerprint/findings';

describe('fingerprintPurpose', () => {
  // Seen live on 2026-09-25: DataDome (as.com, idealista, leboncoin, reuters), Stripe (cnn.com).
  it.each([
    ['DataDome', 'datadome.co'],
    ['DataDome', 'captcha-delivery.com'],
    ['Stripe', 'stripe.com'],
    [null, 'stripe.network'],
    [null, 'online-metrix.net'], // LexisNexis ThreatMetrix
    [null, 'hcaptcha.com'],
    ['HUMAN', 'px-cloud.net'],
    ['Arkose Labs', 'arkoselabs.com'],
  ])('classifies %s (%s) as bot/fraud security', (company, domain) => {
    expect(fingerprintPurpose(company, domain)).toBe('security');
  });

  it.each([
    ['FingerprintJS', 'fpjs.io'],
    ['Google', 'doubleclick.net'],
    [null, 'corriereobjects.it'],
  ])('classifies %s (%s) as other (claimable)', (company, domain) => {
    expect(fingerprintPurpose(company, domain)).toBe('other');
  });

  it('matches company names case-insensitively', () => {
    expect(fingerprintPurpose('datadome', 'x.example')).toBe('security');
  });
});

describe('security fingerprinting is never an "after Reject" claim', () => {
  const ctx: FpContext = {
    site: 'idealista.com',
    rejectedAt: 100,
    domainOf: (url) => new URL(url).hostname.split('.').slice(-2).join('.'),
    companyOf: (d) => (d === 'captcha-delivery.com' ? 'DataDome' : null),
  };

  it('records the purpose and keeps afterReject false for security vendors', () => {
    const f = addFpReport([], { script: 'https://ct.captcha-delivery.com/c.js', technique: 'canvas', at: 500 }, ctx);
    expect(f[0]).toMatchObject({ company: 'DataDome', purpose: 'security', afterReject: false });
  });

  it('still flags other fingerprinting after Reject', () => {
    const f = addFpReport([], { script: 'https://cdn.fpjs.example/a.js', technique: 'canvas', at: 500 }, ctx);
    expect(f[0]).toMatchObject({ purpose: 'other', afterReject: true });
  });
});
