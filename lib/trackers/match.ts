import { registrableDomain, isHttpUrl } from '../util/domains';
import { TRACKERS } from './entities';
import { radarTracker, radarOwner } from './radar';
import { canonicalEntity } from './canonical';

export interface TrackerMatch {
  /** Registrable domain of the request, e.g. "doubleclick.net". */
  trackerDomain: string;
  /** Parent company if recognized, otherwise the domain itself. */
  entity: string;
  /** true = a recognized TRACKER (counts as "tracking you"); false = other third party. */
  known: boolean;
  category?: string;
}

/**
 * Companies that are recognized and named but must NOT count as "tracking you", payments, CDNs,
 * error/perf monitoring, feature flags, and consent-management platforms. Checked at the ENTITY
 * level (after canonicalization) so it covers *every* domain a company owns, including ones only
 * the radar dataset knows about, not just the handful in the curated list.
 */
const ESSENTIAL_ENTITIES = new Set<string>([
  'Stripe', 'PayPal', 'Cloudflare', 'Akamai', 'Fastly',
  'Sentry', 'Datadog', 'New Relic', 'LaunchDarkly',
  'OneTrust', 'Cookiebot', 'Usercentrics', 'Sourcepoint', 'CookieFirst', 'CookieScript', 'Consentmanager',
]);

/** Build a match, applying entity-level essential downgrade + canonicalization consistently. */
function resolve(trackerDomain: string, rawEntity: string, known: boolean, category?: string): TrackerMatch {
  const entity = canonicalEntity(rawEntity);
  if (known && ESSENTIAL_ENTITIES.has(entity)) {
    return { trackerDomain, entity, known: false };
  }
  return { trackerDomain, entity, known, category: known ? category : undefined };
}

/**
 * Decide whether `requestUrl` is a third-party tracker relative to the page at `topLevel`.
 *
 * Resolution order: curated overrides (nicest names) → full Tracker Radar blocklist →
 * broader domain ownership (names the parent without counting it as a tracker) → unknown.
 * Returns null for first-party, non-http, or unparseable requests.
 */
export function matchTracker(requestUrl: string, topLevel: string | null): TrackerMatch | null {
  if (!isHttpUrl(requestUrl)) return null;

  const reqDomain = registrableDomain(requestUrl);
  if (!reqDomain) return null;

  if (topLevel) {
    const topDomain = registrableDomain(topLevel);
    if (topDomain && topDomain === reqDomain) return null; // first-party
  }

  // 1) Curated overrides, friendliest parent names (e.g. "Google (Alphabet)").
  const curated = TRACKERS[reqDomain];
  if (curated) {
    return resolve(reqDomain, curated.entity, !curated.essential, curated.category);
  }

  // 2) Full DuckDuckGo Tracker Radar blocklist.
  const r = radarTracker(reqDomain);
  if (r) {
    return resolve(reqDomain, r.entity, true, r.category);
  }

  // 3) Known owner but not a flagged tracker, name it, but don't count it as a tracker.
  const owner = radarOwner(reqDomain);
  if (owner) {
    return resolve(reqDomain, owner, false);
  }

  // 4) Unknown third party.
  return { trackerDomain: reqDomain, entity: reqDomain, known: false };
}
