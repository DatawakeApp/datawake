import type { FpFinding } from './findings';

/**
 * Companies that fingerprinted the device after the user clicked Reject, by name (or domain when
 * unknown), first seen first. Bot and fraud checks are never counted against a site.
 */
export function fingerprintersAfterReject(findings: readonly FpFinding[]): string[] {
  const names = findings
    .filter((f) => f.afterReject && f.purpose !== 'security')
    .map((f) => f.company ?? f.domain);
  return [...new Set(names)];
}

/** A page is worth recording once it ignored Reject in at least one way. */
export function isReportable(v: { newCookies: readonly unknown[]; fingerprinters: readonly string[] }): boolean {
  return v.newCookies.length > 0 || v.fingerprinters.length > 0;
}
