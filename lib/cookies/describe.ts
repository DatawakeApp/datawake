import type { CookieCategory } from './categorize';
import { matchTracker } from '../trackers/match';

// Known cookie names → plain-English one-liners
const DESCRIPTIONS: Record<string, string> = {
  // ── Google Analytics ──
  _ga: 'Counts your visits and time spent for Google Analytics',
  _gid: 'Remembers you today for Google Analytics traffic counts',
  '_gat_UA': 'Limits how fast Google Analytics collects data',
  _gat: 'Limits how fast Google Analytics collects data',
  '_gcl_au': 'Checks if you clicked a Google ad before buying',
  '_gcl_aw': 'Stores the last Google ad you clicked',
  AMP_TOKEN: 'Used by Google AMP to identify your browser session',

  // ── Google Ads / DoubleClick ──
  IDE: 'Shows you ads based on your browsing history (Google)',
  DSID: 'Identifies you across Google services for ad targeting',
  __gads: 'Measures how Google ads perform on this site',
  __gpi: 'Manages Google publisher ad settings',
  NID: 'Remembers your Google preferences and login state',
  '1P_JAR': 'Used by Google to target and measure ads',
  SAPISID: 'Authenticates your Google account for personalised ads',
  SSID: 'Stores your Google account preferences',
  APISID: 'Stores your Google account preferences',
  SID: 'Stores your Google account session',
  HSID: 'Protects your Google account from hijacking',
  SIDCC: 'Security cookie that verifies your Google session',

  // ── Facebook / Meta ──
  _fbp: 'Tracks you across websites so Facebook can show you relevant ads',
  _fbc: 'Stores the last Facebook ad you clicked',
  fr: 'Stores your Facebook advertising profile for targeting',

  // ── TikTok ──
  '_tt_enable_cookie': 'Enables TikTok tracking cookies on this site',
  _ttp: 'Measures how effective TikTok ads are for advertisers',
  tt_sessionid: 'Tracks your session for TikTok analytics',

  // ── Pinterest ──
  '_pin_unauth': 'Tracks non-logged-in visitors for Pinterest ads',
  _pinterest_ct_ua: 'Used by Pinterest to track conversions from ads',

  // ── Snapchat ──
  _scid: 'Identifies your browser for Snapchat ad measurement',
  _sctr: 'Tracks your activity for Snapchat advertising',

  // ── Twitter / X ──
  _twitter_sess: 'Keeps you logged in to Twitter/X',
  guest_id: 'Identifies you as a guest visitor for Twitter/X tracking',
  personalization_id: 'Used by Twitter/X to show personalised content and ads',

  // ── Microsoft ──
  MUID: 'Identifies your browser for Microsoft advertising',
  muid: 'Identifies your browser for Microsoft advertising',
  _uetsid: 'Tracks your visit after clicking a Microsoft Bing ad',
  _uetvid: 'Identifies return visitors for Microsoft Bing ads',
  _clck: 'Counts unique visitors for Microsoft Clarity heatmaps',
  _clsk: 'Links your page clicks into a session for Microsoft Clarity',
  msclkid: 'Tracks which Microsoft ad brought you here',

  // ── LinkedIn ──
  AnalyticsSyncHistory: 'Stores LinkedIn analytics sync history',
  li_sugr: 'Used by LinkedIn for probabilistic user matching',
  bcookie: 'Browser identifier used by LinkedIn for tracking',
  lidc: 'Selects the LinkedIn data centre to route your request',

  // ── Adobe ──
  demdex: 'Adobe tracking cookie used to identify you across websites',
  dpm: 'Used by Adobe Audience Manager for ad targeting',
  s_ecid: 'Stores your Adobe Experience Cloud identifier',

  // ── Hotjar ──
  _hjid: 'Identifies your browser for Hotjar heatmaps and recordings',
  '_hjAbsoluteSessionInProgress': 'Marks your first visit in this session for Hotjar',
  _hjFirstSeen: 'Detects whether you are a new or returning Hotjar visitor',
  _hjSession: 'Holds your current Hotjar session data',
  _hjSessionUser: 'Your persistent Hotjar visitor ID',

  // ── Segment / Mixpanel / Amplitude ──
  ajs_user_id: 'Stores your Segment analytics user ID',
  ajs_anonymous_id: 'A random ID used by Segment to track anonymous sessions',
  mp_: 'Used by Mixpanel to track your product usage',
  amplitude_id: 'Your Amplitude analytics identifier',

  // ── Mailchimp ──
  mc_eid: 'Tracks which Mailchimp email campaign brought you here',

  // ── Yandex ──
  _ym_uid: 'Identifies you for Yandex Metrica analytics',
  _ym_d: 'Remembers the date of your first Yandex visit',
  _ym_isad: 'Checks whether you have an ad blocker for Yandex',

  // ── Session / Auth ──
  PHPSESSID: 'Keeps you logged in during your visit (deleted when you close the tab)',
  JSESSIONID: 'Keeps you logged in during your visit (deleted when you close the tab)',
  CFID: 'Keeps your ColdFusion session alive',
  CFTOKEN: 'Security token for your ColdFusion session',
  ASP_NET_SessionId: 'Keeps your .NET app session alive',
  __RequestVerificationToken: 'Protects forms from fake submissions (security)',
  csrftoken: 'Protects forms from fake submissions (security)',
  'XSRF-TOKEN': 'Protects forms from fake submissions (security)',
  'connect.sid': 'Keeps your Node.js session alive',
  laravel_session: 'Keeps you logged in on a Laravel app',

  // ── Functional / Preferences ──
  cookieconsent_status: 'Remembers that you accepted or dismissed the cookie banner',
  CookieConsent: 'Stores your cookie consent choices',
  cc_cookie: 'Stores your cookie consent choices',
  lang: 'Remembers your preferred language',
  locale: 'Remembers your region and language setting',
  currency: 'Remembers your preferred currency',
  theme: 'Remembers whether you prefer dark or light mode',
  dark_mode: 'Remembers whether you prefer dark or light mode',
  remember_me: 'Keeps you logged in across browser restarts',
};

// Prefix-based fallback patterns (checked after exact match, longest first)
const PREFIX_PATTERNS: Array<[string, string]> = [
  ['_hjSession', 'Tracks your Hotjar session data'],
  ['_gcl', 'Tracks Google ad clicks and conversions'],
  ['_ga', 'Used by Google Analytics to count visits'],
  ['_fb', 'Used by Facebook/Meta for advertising'],
  ['_tt_', 'Used by TikTok for ad tracking'],
  ['_ym_', 'Used by Yandex Metrica for analytics'],
  ['mp_', 'Used by Mixpanel to track product usage'],
  ['amplitude', 'Used by Amplitude for product analytics'],
  ['_clck', 'Used by Microsoft Clarity for visitor analytics'],
  ['_clsk', 'Used by Microsoft Clarity to track sessions'],
  ['MUID', 'Used by Microsoft for advertising'],
  ['ajs_', 'Used by Segment for analytics tracking'],
];

export function describeCookie(name: string): string | null {
  if (DESCRIPTIONS[name]) return DESCRIPTIONS[name];
  const lower = name.toLowerCase();
  for (const [prefix, desc] of PREFIX_PATTERNS) {
    if (lower.startsWith(prefix.toLowerCase())) return desc;
  }
  return null;
}

const SINGULAR: Record<CookieCategory, string> = {
  tracking: 'tracks you for ads or analytics',
  session: 'keeps you logged in (gone when you close the tab)',
  functional: 'remembers your preferences',
  other: 'has an unknown purpose',
};

const PLURAL: Record<CookieCategory, string> = {
  tracking: 'track you for ads or analytics',
  session: 'keep you logged in (gone when you close the tab)',
  functional: 'remember your preferences',
  other: 'have an unknown purpose',
};

export function groupPhrase(category: CookieCategory, count: number): string {
  return count === 1 ? SINGULAR[category] : PLURAL[category];
}

// ── Violation cookie enrichment ──────────────────────────────────────────────

export interface ViolationCookieDetail {
  /** Cookie name, e.g. "_ga". */
  name: string;
  /** Clean cookie domain, e.g. "doubleclick.net". */
  domain: string;
  /** Parent company that set it (e.g. "Google (Alphabet)"), or the domain if unrecognized. */
  company: string;
  /** Plain-English one-liner on what the cookie does. */
  purpose: string;
}

/** Resolve one violating cookie to the company behind it + a plain-English purpose. */
export function describeViolationCookie(name: string, domain: string): ViolationCookieDetail {
  const clean = domain.replace(/^\./, '');
  const match = matchTracker(`https://${clean}/`, null);
  const company = match?.entity ?? clean;
  const purpose = describeCookie(name) ?? 'Tracks you across websites for advertising or analytics';
  return { name, domain: clean, company, purpose };
}

/** Group violating cookies by the company that set them, each with names + purposes. */
export function groupViolationCookiesByCompany(
  cookies: Array<{ name: string; domain: string }>,
): Array<{ company: string; cookies: ViolationCookieDetail[] }> {
  const byCompany = new Map<string, ViolationCookieDetail[]>();
  for (const c of cookies) {
    const detail = describeViolationCookie(c.name, c.domain);
    const list = byCompany.get(detail.company) ?? [];
    list.push(detail);
    byCompany.set(detail.company, list);
  }
  return [...byCompany.entries()]
    .map(([company, list]) => ({ company, cookies: list }))
    .sort((a, b) => b.cookies.length - a.cookies.length);
}
