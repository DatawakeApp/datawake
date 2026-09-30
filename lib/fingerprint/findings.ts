/**
 * Per-tab fingerprinting findings: which script domains fingerprinted the user on this page, with
 * which techniques, owned by which company, and whether it happened after they clicked Reject
 * (fingerprinting is "storing or accessing information on the device" under ePrivacy Art. 5(3);
 * see EDPB Guidelines 2/2023 on its technical scope).
 */
import type { FpTechnique } from './detector';
import { fingerprintPurpose, type FpPurpose } from './purpose';

export interface FpFinding {
  /** Registrable domain of the fingerprinting script. */
  domain: string;
  /** Company behind it, when known. */
  company: string | null;
  /** The site's own code (same registrable domain as the page). */
  firstParty: boolean;
  /** 'security' = bot/fraud protection: shown, but never an after-Reject claim or penalty. */
  purpose: FpPurpose;
  techniques: FpTechnique[];
  firstSeenAt: number;
  /** Non-security fingerprinting used at least one technique after the user rejected consent. */
  afterReject: boolean;
}

export interface FpReport {
  script: string;
  technique: FpTechnique;
  at: number;
}

export interface FpContext {
  site: string | null;
  rejectedAt: number | null;
  domainOf: (url: string) => string | null;
  companyOf: (domain: string) => string | null;
}

const TECHNIQUES: ReadonlySet<string> = new Set<FpTechnique>(['canvas', 'audio', 'fonts', 'webgl', 'device']);
const MAX_SCRIPT_URL = 2048;

/** Validate a report relayed from the page (page scripts can post look-alike messages). */
export function parseFpReport(raw: unknown): FpReport | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { script, technique, at } = raw as Record<string, unknown>;
  if (typeof script !== 'string' || script.length > MAX_SCRIPT_URL || !/^https?:\/\//.test(script)) return null;
  if (typeof technique !== 'string' || !TECHNIQUES.has(technique)) return null;
  if (typeof at !== 'number' || !Number.isFinite(at)) return null;
  return { script, technique: technique as FpTechnique, at };
}

/** Returns a new findings list with the report folded in (input is not mutated). */
export function addFpReport(findings: readonly FpFinding[], report: FpReport, ctx: FpContext): FpFinding[] {
  const domain = ctx.domainOf(report.script);
  if (!domain) return [...findings];
  const existing = findings.find((f) => f.domain === domain);
  const company = existing ? existing.company : ctx.companyOf(domain);
  const purpose = existing ? existing.purpose : fingerprintPurpose(company, domain);
  const afterReject = purpose !== 'security' && ctx.rejectedAt !== null && report.at >= ctx.rejectedAt;

  if (!existing) {
    return [
      ...findings,
      {
        domain,
        company,
        purpose,
        firstParty: ctx.site !== null && domain === ctx.site,
        techniques: [report.technique],
        firstSeenAt: report.at,
        afterReject,
      },
    ];
  }
  return findings.map((f) =>
    f !== existing
      ? f
      : {
          ...f,
          techniques: f.techniques.includes(report.technique) ? f.techniques : [...f.techniques, report.technique],
          firstSeenAt: Math.min(f.firstSeenAt, report.at),
          afterReject: f.afterReject || afterReject,
        },
  );
}
