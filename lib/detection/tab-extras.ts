/**
 * Per-tab findings that must survive an MV3 service-worker restart (Chrome stops an idle worker
 * after ~30s; in-memory Maps are lost, so the popup would silently drop a caught violation).
 * Stored in `storage.session` alongside the tracker snapshot; restored defensively.
 */
import type { ViolationRecord } from './tracker-store';
import type { FpFinding } from '../fingerprint/findings';
import type { FpTechnique } from '../fingerprint/detector';

export interface TabExtrasSnapshot {
  violations: Record<string, ViolationRecord>;
  tcfCounts: Record<string, number>;
  payOrOk: number[];
  fingerprints: Record<string, FpFinding[]>;
  /** When the cookie banner was rejected on each tab's current page (epoch ms). */
  rejectedAt: Record<string, number>;
}

export interface TabExtras {
  violations: Map<number, ViolationRecord>;
  tcfCounts: Map<number, number>;
  payOrOk: Set<number>;
  fingerprints: Map<number, FpFinding[]>;
  rejectedAt: Map<number, number>;
}

export function snapshotTabExtras(
  violations: ReadonlyMap<number, ViolationRecord | null>,
  tcfCounts: ReadonlyMap<number, number>,
  payOrOk: ReadonlySet<number>,
  fingerprints: ReadonlyMap<number, readonly FpFinding[]> = new Map(),
  rejectedAt: ReadonlyMap<number, number> = new Map(),
): TabExtrasSnapshot {
  return {
    violations: Object.fromEntries(
      [...violations].filter((e): e is [number, ViolationRecord] => e[1] !== null),
    ),
    tcfCounts: Object.fromEntries(tcfCounts),
    payOrOk: [...payOrOk],
    fingerprints: Object.fromEntries([...fingerprints].map(([id, f]) => [id, [...f]])),
    rejectedAt: Object.fromEntries(rejectedAt),
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toTabId = (key: string): number | null => (/^\d+$/.test(key) ? Number(key) : null);

function isViolationRecord(v: unknown): v is ViolationRecord {
  return (
    isRecord(v) &&
    typeof v['detectedAt'] === 'number' &&
    Array.isArray(v['newCookies']) &&
    v['newCookies'].every((c) => isRecord(c) && typeof c['name'] === 'string' && typeof c['domain'] === 'string')
  );
}

const FP_TECHNIQUES: ReadonlySet<string> = new Set<FpTechnique>(['canvas', 'audio', 'fonts', 'webgl', 'device']);

function isFpFinding(v: unknown): v is FpFinding {
  return (
    isRecord(v) &&
    typeof v['domain'] === 'string' &&
    (v['company'] === null || typeof v['company'] === 'string') &&
    typeof v['firstParty'] === 'boolean' &&
    typeof v['firstSeenAt'] === 'number' &&
    typeof v['afterReject'] === 'boolean' &&
    (v['purpose'] === undefined || v['purpose'] === 'security' || v['purpose'] === 'other') &&
    Array.isArray(v['techniques']) &&
    v['techniques'].length > 0 &&
    v['techniques'].every((t) => typeof t === 'string' && FP_TECHNIQUES.has(t))
  );
}

/** Rebuild the maps from storage; malformed entries (or a malformed snapshot) are dropped. */
export function restoreTabExtras(raw: unknown): TabExtras {
  const snap = isRecord(raw) ? raw : {};
  const violations = new Map<number, ViolationRecord>();
  const tcfCounts = new Map<number, number>();
  const payOrOk = new Set<number>();
  const fingerprints = new Map<number, FpFinding[]>();
  const rejectedAt = new Map<number, number>();

  if (isRecord(snap['violations'])) {
    for (const [key, v] of Object.entries(snap['violations'])) {
      const id = toTabId(key);
      if (id !== null && isViolationRecord(v)) violations.set(id, v);
    }
  }
  if (isRecord(snap['tcfCounts'])) {
    for (const [key, n] of Object.entries(snap['tcfCounts'])) {
      const id = toTabId(key);
      if (id !== null && typeof n === 'number' && Number.isInteger(n) && n > 0) tcfCounts.set(id, n);
    }
  }
  if (Array.isArray(snap['payOrOk'])) {
    for (const id of snap['payOrOk']) if (Number.isInteger(id) && id >= 0) payOrOk.add(id as number);
  }
  if (isRecord(snap['fingerprints'])) {
    for (const [key, list] of Object.entries(snap['fingerprints'])) {
      const id = toTabId(key);
      if (id === null || !Array.isArray(list)) continue;
      // Snapshots from before `purpose` existed default to 'other' (new objects, no mutation).
      const valid = list.filter(isFpFinding).map((f) => ({ ...f, purpose: f.purpose ?? 'other' }));
      if (valid.length > 0) fingerprints.set(id, valid);
    }
  }
  if (isRecord(snap['rejectedAt'])) {
    for (const [key, at] of Object.entries(snap['rejectedAt'])) {
      const id = toTabId(key);
      if (id !== null && typeof at === 'number' && Number.isFinite(at) && at > 0) rejectedAt.set(id, at);
    }
  }
  return { violations, tcfCounts, payOrOk, fingerprints, rejectedAt };
}
