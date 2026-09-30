import { groupViolationCookiesByCompany } from '../cookies/describe';

/** The minimal violation input a receipt can be built from. */
export interface ReceiptInput {
  /** Registrable domain the violation happened on, e.g. "brand.com". */
  site: string;
  /** Epoch milliseconds when the violation was detected. */
  timestamp: number;
  /** Tracking cookies set after the user clicked Reject. */
  newCookies: Array<{ name: string; domain: string }>;
}

/** Everything the renderer + caption need, fully shaped, no side effects. */
export interface ReceiptData {
  site: string;
  cookieCount: number;
  companyCount: number;
  /** Short, human company names, most cookies first (e.g. ["Google", "Criteo"]). */
  companies: string[];
  /** How many companies are not in `companies` (for a "+N" tail). */
  moreCompanies: number;
  timestamp: number;
  /** Localized date, e.g. "12 July 2026". */
  dateLabel: string;
  /** Localized 24h time, e.g. "14:07". */
  timeLabel: string;
}

/** Max company names printed on the receipt before collapsing into "+N more". */
const MAX_LISTED_COMPANIES = 3;

/**
 * Collapse a full entity name to a clean short label for the card.
 * "Google (Alphabet)" → "Google"; "Criteo SA" → "Criteo"; a bare domain stays as-is.
 */
export function shortCompanyName(company: string): string {
  const withoutParen = company.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  // Drop a trailing corporate suffix so "Criteo SA" reads as "Criteo".
  const withoutSuffix = withoutParen.replace(
    /\s+(SA|SAS|Inc\.?|LLC|Ltd\.?|GmbH|AB|Corp\.?|Co\.?|BV|B\.V\.|S\.à r\.l\.|plc)$/i,
    '',
  );
  return (withoutSuffix || withoutParen || company).trim();
}

/** Shape a raw violation into the data a receipt is rendered from. Pure. */
export function toReceiptData(input: ReceiptInput): ReceiptData {
  const groups = groupViolationCookiesByCompany(input.newCookies);
  const names = groups.map((g) => shortCompanyName(g.company));
  const listed = names.slice(0, MAX_LISTED_COMPANIES);
  const when = new Date(input.timestamp);

  return {
    site: input.site,
    cookieCount: input.newCookies.length,
    companyCount: groups.length,
    companies: listed,
    moreCompanies: Math.max(0, names.length - listed.length),
    timestamp: input.timestamp,
    dateLabel: when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    timeLabel: when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}
