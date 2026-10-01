import { describe, it, expect } from 'vitest';
import { fingerprintersAfterReject, isReportable } from '../lib/fingerprint/after-reject';
import type { FpFinding } from '../lib/fingerprint/findings';

const f = (over: Partial<FpFinding>): FpFinding => ({
  domain: 'fpjs.io', company: 'FingerprintJS', firstParty: false, purpose: 'other',
  techniques: ['canvas'], firstSeenAt: 1, afterReject: true, ...over,
});

describe('fingerprintersAfterReject', () => {
  it('lists companies that fingerprinted after Reject, by name or domain', () => {
    expect(fingerprintersAfterReject([f({}), f({ company: null, domain: 'odd.net' })])).toEqual(['FingerprintJS', 'odd.net']);
  });

  it('leaves out bot checks, findings before Reject, and duplicates', () => {
    expect(fingerprintersAfterReject([
      f({ purpose: 'security', company: 'DataDome' }),
      f({ afterReject: false, company: 'Early' }),
      f({ domain: 'fpjs.com' }),
      f({}),
    ])).toEqual(['FingerprintJS']);
  });
});

describe('isReportable', () => {
  it('needs cookies or fingerprinting', () => {
    expect(isReportable({ newCookies: [], fingerprinters: [] })).toBe(false);
    expect(isReportable({ newCookies: [{ name: 'a', domain: 'b' }], fingerprinters: [] })).toBe(true);
    expect(isReportable({ newCookies: [], fingerprinters: ['X'] })).toBe(true);
  });
});
