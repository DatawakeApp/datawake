/**
 * Detect "consent or pay" walls, banners where refusing tracking means paying (e.g. Spiegel,
 * marca, Corriere, Daily Mail). Auto-reject must not fire on these: refusing lands the user on a
 * paywall (seen live on abc.es). Instead we skip and tell them the site makes them pay to refuse.
 *
 * Deliberately conservative, a false "this site makes you pay" is a false claim about a site:
 *  1. a visible button that itself combines reject + pay ("Rechazo y me suscribo"), or
 *  2. a visible accept button and a visible pay button inside the SAME consent container
 *     (or anywhere in a CMP sub-frame, whose whole document is the banner). A "Subscribe" link in
 *     the site's own header never counts.
 */
import { isAcceptButtonText, isPayOrOkText, isRejectAndPayText, isRejectButtonText } from './text';

const CLICKABLE = 'button, [role="button"], a, input[type="button"], input[type="submit"]';
const CONSENT_CONTAINER = [
  '[role="dialog"]', '[aria-modal="true"]', 'dialog',
  '[class*="cookie"]', '[class*="consent"]', '[class*="cmp"]', '[class*="gdpr"]', '[class*="privacy"]',
  '[class*="didomi"]', '[id*="cookie"]', '[id*="consent"]', '[id*="cmp"]', '[id*="didomi"]',
  '[id*="onetrust"]', '[id*="sp_message"]', '[id*="usercentrics"]',
].join(', ');
/** A sub-frame only counts as a banner if it talks about consent (not, say, an ad iframe). */
const CONSENT_WORDING =
  /cookie|consent|tracking|partners|privacy|datenschutz|einwilligung|consentimiento|consenso|partenaires|donn[ée]es personnelles/i;
/** Longer "labels" are prose that merely mentions subscribing, not a button. */
const MAX_LABEL = 80;

export interface PayOrOkOptions {
  /** True in a CMP sub-frame: the whole document is the banner. */
  wholeDocIsBanner?: boolean;
}

/** Nearest consent container, never <html>/<body> (some CMPs add classes like `didomi-popup-open`). */
function consentContainer(el: Element): Element | null {
  const box = el.closest(CONSENT_CONTAINER);
  return box && box !== el.ownerDocument.body && box !== el.ownerDocument.documentElement ? box : null;
}

function label(el: Element): string {
  const raw = el.textContent || (el as HTMLInputElement).value || el.getAttribute('aria-label') || '';
  return raw.trim().replace(/\s+/g, ' ');
}

export interface PayOrOkEvidence {
  kind: 'reject-and-pay' | 'accept-beside-pay';
  pay: string;
  accept?: string;
}

export function detectPayOrOkWall(
  doc: Document,
  isVisible: (el: Element) => boolean,
  options: PayOrOkOptions = {},
): boolean {
  return findPayOrOkEvidence(doc, isVisible, options) !== null;
}

/** Why a page counts as a consent-or-pay wall (the matched button labels), or null if it doesn't. */
export function findPayOrOkEvidence(
  doc: Document,
  isVisible: (el: Element) => boolean,
  { wholeDocIsBanner = false }: PayOrOkOptions = {},
): PayOrOkEvidence | null {
  const docIsBanner = wholeDocIsBanner && CONSENT_WORDING.test(doc.body?.textContent ?? '');
  const buttons = Array.from(doc.querySelectorAll(CLICKABLE)).filter((el) => {
    const text = label(el);
    return text.length > 0 && text.length <= MAX_LABEL && isVisible(el);
  });

  const combined = buttons.find((b) => isRejectAndPayText(label(b)));
  if (combined) return { kind: 'reject-and-pay', pay: label(combined) };

  for (const accept of buttons.filter((b) => isAcceptButtonText(label(b)))) {
    const box = docIsBanner ? null : consentContainer(accept);
    if (!docIsBanner && !box) continue;
    const pay = buttons.find(
      (b) => b !== accept && (box === null || box.contains(b)) && isPayOrOkText(label(b)),
    );
    if (pay) return { kind: 'accept-beside-pay', accept: label(accept), pay: label(pay) };
  }
  return null;
}

/**
 * The CMP's banner is on screen: a visible accept or reject button inside a consent container (or
 * anywhere in a consent sub-frame). Used to hold API rejects until a wall could be recognised.
 */
export function hasVisibleConsentUi(
  doc: Document,
  isVisible: (el: Element) => boolean,
  { wholeDocIsBanner = false }: PayOrOkOptions = {},
): boolean {
  const docIsBanner = wholeDocIsBanner && CONSENT_WORDING.test(doc.body?.textContent ?? '');
  return Array.from(doc.querySelectorAll(CLICKABLE)).some((el) => {
    const text = label(el);
    if (!text || text.length > MAX_LABEL) return false;
    if (!isAcceptButtonText(text) && !isRejectButtonText(text)) return false;
    return (docIsBanner || consentContainer(el) !== null) && isVisible(el);
  });
}
