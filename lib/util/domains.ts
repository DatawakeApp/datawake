import { getDomain } from 'tldts';

/**
 * Registrable domain (eTLD+1) for a URL or bare hostname.
 * e.g. "https://stats.g.doubleclick.net/x" -> "doubleclick.net"
 * Returns null when the input can't be parsed into a registrable domain.
 */
export function registrableDomain(urlOrHost: string): string | null {
  try {
    return getDomain(urlOrHost) ?? null;
  } catch {
    return null;
  }
}

/** Only http(s) requests are worth analyzing (skip data:, blob:, chrome-extension:, etc.). */
export function isHttpUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}
