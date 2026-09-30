/**
 * Companies behind fingerprinting-specific domains that tracker lists don't name (so users see
 * "FingerprintJS", not a bare "openfpcdn.io"). Consulted after the tracker lists in background.ts.
 */
const FP_VENDOR_DOMAINS: Readonly<Record<string, string>> = {
  'openfpcdn.io': 'FingerprintJS',
  'fpjs.io': 'FingerprintJS',
  'fpcdn.io': 'FingerprintJS',
  'fpjscdn.net': 'FingerprintJS',
  'fingerprint.com': 'FingerprintJS',
  'fingerprintjs.com': 'FingerprintJS',
};

export function fingerprintVendor(domain: string): string | null {
  return FP_VENDOR_DOMAINS[domain.toLowerCase()] ?? null;
}
