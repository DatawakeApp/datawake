import { registrableDomain } from '../util/domains';

/**
 * Disguised pay walls: the banner offers a free-looking "Continue without accepting", but clicking
 * it sends you to a subscription page (Le Figaro). Nothing in the banner text gives this away, so
 * we spot it afterwards: the tab leaves for a subscription page on the same site right after Reject.
 */

/** How soon after Reject a jump still counts as caused by it, not by the user. */
export const REDIRECT_WINDOW_MS = 8_000;
/** storage.local key for the remembered sites. */
export const WALL_SITES_KEY = 'payWallSites';
/** Sites remembered locally so auto-reject is skipped there next time. */
export const MAX_WALL_SITES = 200;

// Whole words in the host or path, so "about" or "abonnes" don't match.
const SUBSCRIBE_RE =
  /(^|[./_-])(abonnement|abonnements|abonnieren|abo|subscribe|subscription|subscriptions|suscripcion|suscribete|suscribirse|abbonamento|abbonati|assinatura|checkout|paywall)([./_?#-]|$)/i;

export interface RedirectCheck {
  fromSite: string;
  toUrl: string;
  msSinceReject: number;
}

export function isDisguisedWallRedirect({ fromSite, toUrl, msSinceReject }: RedirectCheck): boolean {
  if (msSinceReject < 0 || msSinceReject > REDIRECT_WINDOW_MS) return false;
  let url: URL;
  try {
    url = new URL(toUrl);
  } catch {
    return false;
  }
  if (registrableDomain(url.hostname) !== fromSite) return false;
  return SUBSCRIBE_RE.test(url.hostname) || SUBSCRIBE_RE.test(url.pathname);
}

/** Returns a new list with `site` last, without duplicates, capped to the most recent entries. */
export function addWallSite(list: readonly string[], site: string): string[] {
  const next = [...list.filter((s) => s !== site), site];
  return next.slice(-MAX_WALL_SITES);
}

/** Returns a new list without `site` (the user chose to let Datawake reject there again). */
export function removeWallSite(list: readonly string[], site: string): string[] {
  return list.filter((s) => s !== site);
}
