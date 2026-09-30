const KEY_STORE = 'trace_hibp_key';
const BASE = 'https://haveibeenpwned.com/api/v3';

export interface Breach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  PwnCount: number;
  DataClasses: string[];
  IsVerified: boolean;
  IsSensitive: boolean;
  Description: string;
}

export function loadKey(): string {
  return localStorage.getItem(KEY_STORE) ?? '';
}

export function saveKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(KEY_STORE, trimmed);
  else localStorage.removeItem(KEY_STORE);
}

/**
 * Check an email against HIBP. Returns the breach list (may be empty).
 * Throws { code: 401 } on bad key, { code: 429 } on rate limit, { code: number } on other errors.
 */
export async function checkBreaches(email: string, apiKey: string): Promise<Breach[]> {
  const url = `${BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
  const res = await fetch(url, {
    headers: {
      'hibp-api-key': apiKey,
      'User-Agent': 'Trace-Extension',
    },
  });

  if (res.status === 404) return []; // no breaches, HIBP returns 404, not []
  if (!res.ok) throw { code: res.status };

  return (await res.json()) as Breach[];
}
