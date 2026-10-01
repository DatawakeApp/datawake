/**
 * Reject buttons of known consent platforms, tried before the text-based fallback in content.ts.
 * Each one is that platform's "reject all" / "deny" / "required only" control, never an accept.
 */
export const REJECT_SELECTORS: readonly string[] = [
  // OneTrust
  '#onetrust-reject-all-handler',
  '.ot-pc-refuse-all-handler',
  // Cookiebot
  '#CybotCookiebotDialogBodyButtonDecline',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll',
  // Didomi
  '#didomi-notice-disagree-button',
  // Usercentrics
  '[data-testid="uc-deny-all-button"]',
  // Consentmanager
  '.cmpboxbtnno',
  '[data-cmp-action="reject"]',
  // Sourcepoint (runs in its own iframe; choice type 13 is "reject all")
  '.sp_choice_type_13',
  '.sp_choice_type_REJECT_ALL',
  // TrustArc ("Required only")
  '#truste-consent-required',
  // Osano
  '.osano-cm-denyAll',
  // CookieYes
  '.cky-btn-reject',
  // Complianz
  '.cmplz-deny',
  // iubenda
  '.iubenda-cs-reject-btn',
  // Axeptio
  '#axeptio_btn_dismiss',
  // Klaro
  '.cm-btn-decline',
  // Termly
  '[data-tid="banner-decline"]',
  // Cookie-Script
  '#cookiescript_reject',
  // CookieFirst
  '[data-cookiefirst-action="reject"]',
  // Borlabs Cookie
  '._brlbs-refuse-btn',
  // Cookie Notice (WordPress)
  '#cn-refuse-cookie',
  // Cookie Consent (Osano open source)
  '.cc-deny',
  // Generic naming conventions
  '[id*="reject-all"]',
  '[id*="decline-all"]',
  '[class*="reject-all"]',
  '[class*="decline-all"]',
  '[aria-label*="reject" i]',
  '[aria-label*="decline" i]',
];

/** First visible element matching a known reject selector, or null. */
export function findRejectBySelector(root: ParentNode, isVisible: (el: Element) => boolean): HTMLElement | null {
  for (const sel of REJECT_SELECTORS) {
    // A page can hold several copies (e.g. Complianz renders hidden banner variants first).
    for (const el of root.querySelectorAll<HTMLElement>(sel)) if (isVisible(el)) return el;
  }
  return null;
}
