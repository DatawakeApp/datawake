import { describe, it, expect } from 'vitest';
import { fingerprintVendor } from '../lib/fingerprint/vendors';

describe('fingerprintVendor', () => {
  it.each([
    ['openfpcdn.io', 'FingerprintJS'], // seen live on ara.cat
    ['fpjs.io', 'FingerprintJS'],
    ['fpcdn.io', 'FingerprintJS'],
    ['fingerprint.com', 'FingerprintJS'],
  ])('names %s as %s', (domain, name) => expect(fingerprintVendor(domain)).toBe(name));

  it('returns null for unknown domains', () => {
    expect(fingerprintVendor('example.com')).toBeNull();
  });
});
