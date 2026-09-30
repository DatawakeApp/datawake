import { matchTracker } from '../trackers/match';

export type CookieCategory = 'tracking' | 'session' | 'functional' | 'other';

export interface CategorizedCookie {
  name: string;
  category: CookieCategory;
  session: boolean;
}

interface RawCookie {
  name: string;
  session: boolean;
  /** Cookie domain, if known, lets us classify by owner, not just by name. */
  domain?: string;
}

/** True if this cookie's domain belongs to a recognized tracking company. */
function isTrackerCookieDomain(domain: string): boolean {
  const clean = domain.replace(/^\./, '');
  return matchTracker(`https://${clean}/`, null)?.known === true;
}

// Distinctive tracking cookie name prefixes, safe to match as a prefix.
const TRACKING_PREFIX_RE =
  /^(_ga|_gid|_gcl|_fbp|_fbc|_tt_|_ttp|_pin_|_scid|_sctr|__gads|__gpi|_ym_|_hj|mc_eid|msclkid|_uetsid|_uetvid|_clck|_clsk|demdex|uuid2|tuuid)/i;
// Short/generic tokens that are tracking cookies ONLY as an exact name, matching them as
// prefixes would mislabel functional cookies (SIDEBAR, IDENTITY, "from", "friends"…).
const TRACKING_EXACT = new Set([
  'ide', 'dsid', 'nid', 'fr', 'amp_token', '1p_jar',
  'sapisid', 'ssid', 'apisid', 'sid', 'hsid', 'sidcc', 'muid', 'anj', 'dpm',
]);

function isTrackingName(name: string): boolean {
  return TRACKING_PREFIX_RE.test(name) || TRACKING_EXACT.has(name.toLowerCase());
}

// Session management
const SESSION_RE =
  /^(PHPSESSID|JSESSIONID|CFID|CFTOKEN|ASP\.NET_SessionId|__RequestVerificationToken|csrftoken|XSRF-TOKEN|laravel_session|connect\.sid|_rails|rack\.session)/i;
const SESSION_WORD_RE = /sess(ion)?|token|csrf|xsrf/i;

// Functional / preference cookies
const FUNCTIONAL_RE =
  /^(lang|locale|currency|theme|dark_mode|color_scheme|prefs|preferences|settings|timezone|country|region|remember_me|_gat|cookieconsent|cc_|gdpr|consent_|CookieConsent)/i;

export function categorizeCookies(cookies: RawCookie[]): CategorizedCookie[] {
  return cookies.map((c) => {
    const name = c.name;
    let category: CookieCategory = 'other';
    // A cookie set on a known tracker's domain is a tracking cookie whatever it's named.
    if (c.domain && isTrackerCookieDomain(c.domain)) category = 'tracking';
    else if (isTrackingName(name)) category = 'tracking';
    else if (SESSION_RE.test(name) || SESSION_WORD_RE.test(name)) category = 'session';
    else if (FUNCTIONAL_RE.test(name)) category = 'functional';
    return { name, category, session: c.session };
  });
}

/**
 * Cookies that can legitimately appear right after a "Reject" click and must NOT be counted
 * as a tracking violation, flagging them would be a false "they tracked you anyway" alarm:
 *  - consent records (incl. the cookie that stores your *rejection*) and opt-out flags
 *  - security / anti-bot cookies (Cloudflare, DataDome, Imperva) set for protection, not tracking
 *  - plain session / functional cookies
 * Note: this is name-based and deliberately errs toward NOT crying wolf, for the flagship
 * violation feature a false accusation is far more damaging than a missed detection.
 */
const CONSENT_OPTOUT_RE =
  /(consent|optanon|euconsent|eupubconsent|us[-_]?privacy|gdpr|ccpa|opt[-_]?out|truste|evidon|cmapi|onetrust|cookiebot)/i;
const SECURITY_RE =
  /^(__cf_bm|__cfduid|cf_clearance|__cflb|_cfuvid|incap_ses|nlbi_|visid_incap|ak_bmsc|bm_s[vz]|datadome|sucuri)/i;

// "Can this browser store cookies?" probes, no identifier, so not tracking on their own.
const COOKIE_PROBE_RE = /^_?test_?cookie$/i;

export function isNonViolationCookie(name: string): boolean {
  if (COOKIE_PROBE_RE.test(name)) return true;
  const category = categorizeCookies([{ name, session: false }])[0].category;
  if (category === 'session' || category === 'functional') return true;
  return CONSENT_OPTOUT_RE.test(name) || SECURITY_RE.test(name);
}

export function summarizeCookies(
  cookies: CategorizedCookie[],
): Record<CookieCategory, number> {
  const counts: Record<CookieCategory, number> = {
    tracking: 0,
    session: 0,
    functional: 0,
    other: 0,
  };
  for (const c of cookies) counts[c.category]++;
  return counts;
}
