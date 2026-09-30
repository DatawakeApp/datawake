/**
 * Split the popup's cookie list into this site's own cookies and the cookies stored by the
 * tracking companies on the page. Tracker cookies (Google's, Meta's…) are shared by every site
 * that loads those trackers, so they build up across all your browsing, not just this site.
 */
import { registrableDomain } from '../util/domains';

export interface CookieLike {
  name: string;
  session: boolean;
  domain?: string;
}

export function splitCookiesBySite<T extends CookieLike>(cookies: readonly T[], site: string | null): { own: T[]; trackers: T[] } {
  if (!site) return { own: [...cookies], trackers: [] };
  const own: T[] = [];
  const trackers: T[] = [];
  for (const cookie of cookies) {
    const host = cookie.domain?.replace(/^\./, '');
    const isOwn = !host || registrableDomain(host) === site;
    (isOwn ? own : trackers).push(cookie);
  }
  return { own, trackers };
}
