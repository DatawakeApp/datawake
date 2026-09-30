/**
 * Best-effort privacy contact for a company. Many large companies require their own
 * web form rather than email, so this is only a suggested starting point the user edits.
 */
export function guessPrivacyContact(domain?: string): string {
  if (!domain) return '';
  const host = domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
  return host ? `privacy@${host}` : '';
}
