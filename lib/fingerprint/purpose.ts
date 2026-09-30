/**
 * Why is this script fingerprinting? Anti-bot and anti-fraud services (DataDome, Stripe Radar,
 * ThreatMetrix, hCaptcha…) fingerprint devices to block bots and payment fraud, something ePrivacy
 * can treat as strictly necessary for security. Datawake still SHOWS them (transparency) but never
 * turns them into an "after you said no" claim or a score penalty, consistent with how security
 * cookies (e.g. `datadome`) are excluded from cookie violations in lib/cookies/categorize.ts.
 */

export type FpPurpose = 'security' | 'other';

const SECURITY_COMPANIES = new Set(
  [
    'DataDome', 'Stripe', 'PayPal', 'Adyen', 'Akamai', 'Cloudflare', 'Imperva', 'Kasada',
    'HUMAN', 'HUMAN Security', 'PerimeterX', 'Arkose Labs', 'hCaptcha', 'Intuition Machines',
    'Sift', 'Sift Science', 'Forter', 'Riskified', 'Signifyd', 'Kount', 'LexisNexis',
    'ThreatMetrix', 'F5', 'Shape Security', 'BioCatch', 'Iovation', 'TransUnion',
  ].map((c) => c.toLowerCase()),
);

/** Registrable domains of bot/fraud-protection services (for when the company name is unknown). */
const SECURITY_DOMAINS = new Set([
  'datadome.co', 'captcha-delivery.com',
  'stripe.com', 'stripe.network', 'paypal.com', 'paypalobjects.com',
  'online-metrix.net', 'hcaptcha.com', 'recaptcha.net',
  'perimeterx.net', 'px-cdn.net', 'px-cloud.net', 'arkoselabs.com', 'funcaptcha.com',
  'siftscience.com', 'sift.com', 'forter.com', 'riskified.com', 'signifyd.com', 'kount.net',
  'incapsula.com', 'imperva.com', 'iesnare.com', 'iovation.com', 'biocatch.com',
]);

export function fingerprintPurpose(company: string | null, domain: string): FpPurpose {
  if (company && SECURITY_COMPANIES.has(company.toLowerCase())) return 'security';
  return SECURITY_DOMAINS.has(domain.toLowerCase()) ? 'security' : 'other';
}
