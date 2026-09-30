import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { detectPayOrOkWall, hasVisibleConsentUi } from '../lib/cmp/pay-or-ok';

// linkedom has no layout engine, so visibility is injected: everything without [hidden] is visible.
const visible = (el: Element): boolean => !el.closest('[hidden]');
const detect = (html: string, wholeDocIsBanner = false): boolean =>
  detectPayOrOkWall(parseHTML(`<html><body>${html}</body></html>`).document, visible, { wholeDocIsBanner });

// Markup modelled on the live banners seen in QA on 2026-09-25.
describe('detectPayOrOkWall', () => {
  it('detects a combined reject-and-pay button (marca.com)', () => {
    expect(detect(`<div id="didomi-notice">
      <button>Acepto y continúo gratis</button><button>Rechazo y me suscribo</button></div>`)).toBe(true);
  });

  it.each(['Rifiuta e abbonati', 'Reject and Purchase Daily Mail Essential', 'Refuser et s’abonner'])(
    'detects combined button: %s',
    (text) => expect(detect(`<div class="cmp-banner"><button>Accetta</button><button>${text}</button></div>`)).toBe(true),
  );

  it('detects accept + subscribe in the same consent dialog (Spiegel)', () => {
    expect(detect(`<div role="dialog"><h2>Welcome!</h2>
      <button>Consent and continue</button><button>Subscribe now</button>
      <button>Preferences</button></div>`)).toBe(true);
  });

  it('detects it inside a CMP sub-frame, where the whole document is the banner', () => {
    expect(detect(`<p>We and our partners use cookies…</p>
      <button>Accept all</button><a href="#">Get Ad-Lite for €5/month</a>`, true)).toBe(true);
  });

  it('ignores an ad iframe with OK + Buy buttons (no consent wording)', () => {
    expect(detect(`<p>Summer sale, 50% off sneakers!</p><button>OK</button><a>Buy now for €49</a>`, true)).toBe(false);
  });

  it('ignores a normal banner with a real reject button', () => {
    expect(detect(`<div id="onetrust-banner-sdk">
      <button>Accept all</button><button>Reject all</button></div>`)).toBe(false);
  });

  it('ignores a subscribe link in the site header when the banner has no pay option', () => {
    expect(detect(`<header><nav><a href="/subscribe">Subscribe</a><a>Suscríbete</a></nav></header>
      <div class="cookie-consent"><button>Accept all</button><button>Reject all</button></div>`)).toBe(false);
  });

  it('ignores a subscribe link next to an accept button outside any consent container', () => {
    expect(detect(`<main><div><button>Accept invitation</button><a>Subscribe to newsletter</a></div></main>`)).toBe(false);
  });

  // False positives seen live on lefigaro.fr (2026-09-25), which offers a free "Continue without accepting".
  it('ignores headlines that merely contain an accept word', () => {
    expect(detect(`<div class="fig-privacy-zone"><a>À Gaza, Israël continue sa traque du Hamas</a>
      <a>Gérer votre abonnement</a></div>`)).toBe(false);
  });

  it('ignores "already subscribed? sign in" links', () => {
    expect(detect(`<p>We and our 249 partners use cookies</p><button>Accept all</button>
      <button>Set up</button><a>Already subscribed? Sign in</a>`, true)).toBe(false);
    expect(detect(`<div class="consent"><button>Accepter</button><a>Déjà abonné ? Se connecter</a></div>`)).toBe(false);
  });

  it.each(['Rechazar y pagar', 'Rifiuta e paga', 'Refuser et payer', 'Ablehnen und bezahlen'])(
    'detects "reject and pay" in other languages (abc.es): %s',
    (text) => expect(detect(`<div class="didomi-notice"><button>Aceptar y continuar</button><button>${text}</button></div>`)).toBe(true),
  );

  it('never treats <body> as the consent container (Didomi adds a class to it)', () => {
    const doc = parseHTML(`<html><body class="didomi-popup-open">
      <nav><a>Suscríbete</a></nav><a>Continue reading: the budget debate</a></body></html>`).document;
    expect(detectPayOrOkWall(doc, visible)).toBe(false);
    expect(hasVisibleConsentUi(doc, visible)).toBe(false);
  });

  it('detects German Pur-Abo walls', () => {
    expect(detect(`<div class="cmp-root"><button>Akzeptieren und weiter</button><button>Zum Pur-Abo</button></div>`)).toBe(true);
  });

  it('ignores hidden pay buttons', () => {
    expect(detect(`<div class="consent"><button>Accept</button><button hidden>Subscribe</button></div>`)).toBe(false);
  });

  it('ignores long paragraphs that merely mention subscribing', () => {
    expect(detect(`<div class="consent"><button>Accept</button>
      <a>You can also read our privacy policy, manage your subscription preferences, and learn how we use data in detail here</a></div>`)).toBe(false);
  });
});

describe('hasVisibleConsentUi', () => {
  const has = (html: string, wholeDocIsBanner = false): boolean =>
    hasVisibleConsentUi(parseHTML(`<html><body>${html}</body></html>`).document, visible, { wholeDocIsBanner });

  it('is true when a consent container shows an accept or reject button', () => {
    expect(has(`<div id="didomi-host"><button>Aceptar y cerrar</button></div>`)).toBe(true);
    expect(has(`<div class="cmp"><button>Reject all</button></div>`)).toBe(true);
  });

  it('is false before the banner renders, or when it is hidden', () => {
    expect(has(`<header><a>Subscribe</a></header>`)).toBe(false);
    expect(has(`<div class="cmp" hidden><button>Accept all</button></div>`)).toBe(false);
  });
});
