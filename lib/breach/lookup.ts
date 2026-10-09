/**
 * Email breach lookup with nothing to set up: the browser asks the XposedOrNot breach database
 * directly (free, no key), so the email never passes through Datawake. Their terms ask apps to
 * credit them wherever the data is shown.
 */

export const BREACH_SOURCE = { name: 'XposedOrNot', url: 'https://xposedornot.com' } as const;

export interface Breach {
  name: string;
  year: string;
  records: number;
  exposed: string[];
  plaintextPasswords: boolean;
}

export function lookupUrl(email: string): string {
  return `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;
}

/** "ManchesterAirportsGroup" reads as "Manchester Airports Group"; short names like "LinkedIn" stay. */
export function readableName(name: string): string {
  const humps = name.match(/[a-z][A-Z]/g)?.length ?? 0;
  return humps >= 2 ? name.replace(/([a-z])([A-Z])/g, '$1 $2') : name;
}

/** The database's response as breaches, newest first. Anything malformed is dropped. */
export function parseBreaches(json: unknown): Breach[] {
  const details = (json as { ExposedBreaches?: { breaches_details?: unknown } } | null)?.ExposedBreaches?.breaches_details;
  if (!Array.isArray(details)) return [];
  const out: Breach[] = [];
  for (const d of details) {
    if (typeof d !== 'object' || d === null || typeof (d as { breach?: unknown }).breach !== 'string') continue;
    const r = d as { breach: string; xposed_date?: unknown; xposed_records?: unknown; xposed_data?: unknown; password_risk?: unknown };
    out.push({
      name: readableName(r.breach),
      year: typeof r.xposed_date === 'string' ? r.xposed_date : '',
      records: typeof r.xposed_records === 'number' ? r.xposed_records : 0,
      exposed: typeof r.xposed_data === 'string' ? r.xposed_data.split(';').map((s) => s.trim()).filter(Boolean) : [],
      plaintextPasswords: r.password_risk === 'plaintext',
    });
  }
  return out.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
}

export class BreachLookupError extends Error {
  constructor(readonly status: number) {
    super(`breach lookup failed: ${status}`);
  }
}

export async function checkBreaches(email: string): Promise<Breach[]> {
  const res = await fetch(lookupUrl(email));
  if (!res.ok) throw new BreachLookupError(res.status);
  return parseBreaches(await res.json());
}
