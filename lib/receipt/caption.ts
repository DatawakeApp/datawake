import type { ReceiptData } from './model';

/** Where users are sent to install, kept in one place so it's easy to change. */
export const SITE_URL = 'datawake.app';

/**
 * The pre-written social caption that travels with a shared receipt.
 * Runs the emotional arc (betrayal → proof → agency) and always ends on an action.
 * Plain language with no jargon, and "may be" rather than "is" on legality (never over-claim).
 */
export function receiptCaption(data: ReceiptData): string {
  const cookieWord = data.cookieCount === 1 ? 'tracking cookie' : 'tracking cookies';
  const companyClause =
    data.companyCount === 1 ? 'a company' : `${data.companyCount} companies`;

  return [
    `I clicked "Reject" on ${data.site}. They let ${companyClause} track me anyway.`,
    `${data.cookieCount} ${cookieWord} set after I said no. This may be illegal under GDPR.`,
    ``,
    `Caught with Datawake 🧾 Check who ignores your Reject → https://${SITE_URL}`,
    ``,
    `#CaughtByDatawake #privacy`,
  ].join('\n');
}

/** A short one-line summary used as the share sheet's title / accessible label. */
export function receiptTitle(data: ReceiptData): string {
  return `${data.site} tracked you after you clicked Reject`;
}

/** Safe filename for the downloaded PNG, e.g. "datawake-caught-brand-com.png". */
export function receiptFileName(data: ReceiptData): string {
  const slug = data.site.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return `datawake-caught-${slug || 'site'}.png`;
}
