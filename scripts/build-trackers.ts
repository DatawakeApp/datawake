/**
 * Compile DuckDuckGo's consolidated Tracker DataSet (TDS) into a compact map the
 * extension bundles: domain -> parent company (+ human category), plus a broader
 * domain -> owner table for naming non-flagged third parties.
 *
 * Run: npm run build:trackers   (writes lib/trackers/radar.generated.json)
 */
import fs from 'node:fs';
import { fillFromOwner, humanCategory } from '../lib/trackers/radar-category';
import path from 'node:path';

const TDS_URL = 'https://staticcdn.duckduckgo.com/trackerblocking/v5/current/extension-tds.json';
const OUT = path.resolve('lib/trackers/radar.generated.json');

/** Map TDS's method-oriented categories into buckets a regular person understands. */
async function main(): Promise<void> {
  console.log('Fetching TDS…');
  const res = await fetch(TDS_URL);
  if (!res.ok) throw new Error(`TDS fetch failed: ${res.status}`);
  const tds: any = await res.json();

  const entities: string[] = [];
  const entityIdx = new Map<string, number>();
  const ei = (name: string): number => {
    let i = entityIdx.get(name);
    if (i === undefined) {
      i = entities.length;
      entities.push(name);
      entityIdx.set(name, i);
    }
    return i;
  };

  const categories: string[] = [''];
  const catIdx = new Map<string, number>([['', 0]]);
  const ci = (c: string): number => {
    let i = catIdx.get(c);
    if (i === undefined) {
      i = categories.length;
      categories.push(c);
      catIdx.set(c, i);
    }
    return i;
  };

  // Flagged trackers → [entityIndex, categoryIndex, fingerprintingScore]
  // (TDS scores fingerprinting 0-3: how heavily the domain's scripts use fingerprinting APIs.)
  const rows: Array<{ domain: string; owner: string; category: string; fp: number }> = [];
  for (const [domain, t] of Object.entries<any>(tds.trackers ?? {})) {
    const name = t?.owner?.displayName || t?.owner?.name;
    if (!name) continue;
    const fp = Number.isInteger(t.fingerprinting) ? Math.min(3, Math.max(0, t.fingerprinting)) : 0;
    rows.push({ domain, owner: name, category: humanCategory(t.categories, domain), fp });
  }
  const trackers: Record<string, [number, number, number]> = {};
  for (const r of fillFromOwner(rows)) trackers[r.domain] = [ei(r.owner), ci(r.category), r.fp];

  // Broader ownership (domain -> owner display name) for naming non-flagged third parties.
  const owners: Record<string, number> = {};
  for (const [domain, entName] of Object.entries<any>(tds.domains ?? {})) {
    if (typeof entName !== 'string') continue;
    const display = tds.entities?.[entName]?.displayName || entName;
    owners[domain] = ei(display);
  }

  const out = { v: new Date().toISOString().slice(0, 10), entities, categories, trackers, owners };
  fs.writeFileSync(OUT, JSON.stringify(out));

  const kb = Math.round(JSON.stringify(out).length / 1024);
  console.log(
    `trackers=${Object.keys(trackers).length} owners=${Object.keys(owners).length} ` +
      `entities=${entities.length} categories=${categories.length}`,
  );
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
