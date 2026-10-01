import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { REJECT_SELECTORS, findRejectBySelector } from '../lib/cmp/selectors';

const find = (html: string): string | null => {
  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  return findRejectBySelector(document, () => true)?.textContent?.trim() ?? null;
};

describe('REJECT_SELECTORS', () => {
  it('are all valid CSS selectors', () => {
    const { document } = parseHTML('<html><body></body></html>');
    for (const sel of REJECT_SELECTORS) expect(() => document.querySelector(sel), sel).not.toThrow();
  });

  it.each([
    ['Sourcepoint', '<div class="message"><button class="message-component message-button sp_choice_type_11">Accept all</button><button class="message-component message-button sp_choice_type_13">Reject all</button></div>'],
    ['TrustArc', '<div id="truste-consent-track"><button id="truste-consent-button">Accept</button><button id="truste-consent-required">Required only</button></div>'],
    ['Osano', '<div class="osano-cm-dialog"><button class="osano-cm-accept-all">Accept</button><button class="osano-cm-denyAll">Deny</button></div>'],
    ['CookieYes', '<div class="cky-consent-bar"><button class="cky-btn cky-btn-reject">Reject All</button></div>'],
    ['Complianz', '<div class="cmplz-cookiebanner"><button class="cmplz-btn cmplz-deny">Deny</button></div>'],
    ['iubenda', '<div id="iubenda-cs-banner"><button class="iubenda-cs-reject-btn">Reject</button></div>'],
    ['Axeptio', '<div class="axeptio_widget"><button id="axeptio_btn_dismiss">No thanks</button></div>'],
    ['Klaro', '<div class="klaro"><button class="cm-btn cm-btn-decline">Decline</button></div>'],
    ['Termly', '<div><button data-tid="banner-decline">Decline</button></div>'],
    ['Cookie-Script', '<div id="cookiescript_injected"><div id="cookiescript_reject">Decline all</div></div>'],
    ['CookieFirst', '<div><button data-cookiefirst-action="reject">Reject all</button></div>'],
    ['Cookie Notice', '<div id="cookie-notice"><a id="cn-refuse-cookie">No</a></div>'],
  ])('finds the %s reject button', (_name, html) => {
    expect(find(html)).not.toBeNull();
  });

  it('does not match the accept buttons of the same banners', () => {
    expect(find('<div><button class="sp_choice_type_11">Accept all</button><button id="truste-consent-button">Accept</button></div>')).toBeNull();
  });
});
