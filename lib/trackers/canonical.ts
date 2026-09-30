/**
 * Collapse the different names the curated list and the Tracker Radar dataset use for the
 * same company into one canonical label, so a company never appears as two rows and so our
 * curated notes/flows match (e.g. "Rubicon Project" → "Magnite").
 */
const ALIASES: Record<string, string> = {
  // Google
  Google: 'Google (Alphabet)',
  'Google LLC': 'Google (Alphabet)',
  // Amazon
  'Amazon.com': 'Amazon',
  'Amazon Technologies, Inc.': 'Amazon',
  'Amazon Web Services, Inc.': 'Amazon',
  // Meta
  Facebook: 'Meta',
  'Facebook, Inc.': 'Meta',
  'Meta Platforms, Inc.': 'Meta',
  // Microsoft family
  'Microsoft Corporation': 'Microsoft',
  'LinkedIn Corporation': 'Microsoft (LinkedIn)',
  LinkedIn: 'Microsoft (LinkedIn)',
  Xandr: 'Microsoft (Xandr)',
  AppNexus: 'Microsoft (Xandr)',
  // X / Twitter
  Twitter: 'X (Twitter)',
  'Twitter, Inc.': 'X (Twitter)',
  'X Corp.': 'X (Twitter)',
  // Adobe / Oracle
  'Adobe Inc.': 'Adobe',
  'Adobe Systems Incorporated': 'Adobe',
  'Oracle Corporation': 'Oracle',
  // Social
  'Snap Inc.': 'Snap',
  'Pinterest, Inc.': 'Pinterest',
  'TikTok Pte. Ltd.': 'ByteDance (TikTok)',
  ByteDance: 'ByteDance (TikTok)',
  // Yahoo
  'Yahoo! Inc.': 'Yahoo',
  'Verizon Media': 'Yahoo',
  Oath: 'Yahoo',
  // Ad exchanges merged
  'Rubicon Project': 'Magnite',
  'The Rubicon Project': 'Magnite',
  Telaria: 'Magnite',
  SpotX: 'Magnite',
  'Smart AdServer': 'Equativ',
  // Identity / brokers merged
  Neustar: 'TransUnion (Neustar)',
  Tapad: 'Experian (Tapad)',
  // Retargeting / analytics merged
  AdRoll: 'NextRoll (AdRoll)',
  NextRoll: 'NextRoll (AdRoll)',
  Hotjar: 'Contentsquare (Hotjar)',
  Contentsquare: 'Contentsquare (Hotjar)',
  Segment: 'Twilio (Segment)',
  Twilio: 'Twilio (Segment)',
  Krux: 'Salesforce (Krux)',
  // Salesforce
  'Salesforce.com': 'Salesforce',
  'Salesforce, Inc.': 'Salesforce',
  // Google sub-brands
  'Google Ads (Google)': 'Google (Alphabet)',
  'Google Analytics': 'Google (Alphabet)',
  'DoubleClick (Google)': 'Google (Alphabet)',
  // Measurement firms
  'The Nielsen Company': 'Nielsen',
  'Nielsen Holdings': 'Nielsen',
  comScore: 'Comscore',
  'comScore, Inc.': 'Comscore',
  // Analytics name variants
  Parsely: 'Parse.ly',
  'Parse.ly, Inc.': 'Parse.ly',
  // Infrastructure
  'International Business Machines': 'IBM',
  'IBM Corp.': 'IBM',
  'Akamai Technologies, Inc.': 'Akamai',
  'Akamai Technologies': 'Akamai',
  'Cloudflare, Inc.': 'Cloudflare',
  'Fastly, Inc.': 'Fastly',
  // Additional ad-tech
  AdThrive: 'Raptive (AdThrive)',
  Raptive: 'Raptive (AdThrive)',
  // Essential-entity radar name variants (so entity-level essential covers all their domains)
  'Functional Software': 'Sentry',
  'Functional Software, Inc.': 'Sentry',
  'Datadog, Inc.': 'Datadog',
  'Stripe, Inc.': 'Stripe',
  'New Relic, Inc.': 'New Relic',
  'Jaohawi AB': 'Consentmanager',
  'consentmanager GmbH': 'Consentmanager',
  'Usercentrics GmbH': 'Usercentrics',
  'Cybot A/S': 'Cookiebot',
};

export function canonicalEntity(name: string): string {
  return ALIASES[name] ?? name;
}
