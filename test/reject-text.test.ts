import { describe, it, expect } from 'vitest';
import { isRejectButtonText } from '../lib/cmp/text';

describe('isRejectButtonText', () => {
  it.each([
    'Reject all',
    'Reject',
    'Decline',
    'Deny all',
    'No thanks',
    'Rechazar todo',
    'Alle ablehnen',
    'Tout refuser',
    'Rifiuta tutto',
    'Reject all cookies', // "cookies" contains "ok", must not trip the accept guard
    'Rechazar cookies',
    'Decline optional cookies',
  ])('accepts plain reject: %s', (t) => expect(isRejectButtonText(t)).toBe(true));

  it.each([
    'I do not agree', // BBC (Sourcepoint)
    "I don't agree",
    'Do not agree',
    'No acepto', // was blocked by the accept guard ("acepto")
    'Continue without accepting', // Le Figaro, CNIL-style reject
    'Continuer sans accepter',
    'Continua senza accettare',
    'Continuar sin aceptar',
    'Weiter ohne Zustimmung',
  ])('accepts negated-accept reject: %s', (t) => expect(isRejectButtonText(t)).toBe(true));

  it.each([
    'Accept all',
    'I agree',
    'Agree and close',
    'Accept and continue',
    'Aceptar',
    'Alle akzeptieren',
    'OK',
    'Got it',
  ])('rejects accept buttons: %s', (t) => expect(isRejectButtonText(t)).toBe(false));

  it.each([
    'Reject and Purchase Daily Mail Essential', // consent-or-pay: leads to a paywall
    'Rifiuta e abbonati', // Corriere
    'Reject and subscribe',
    'Refuser et s’abonner',
    'Ablehnen und abonnieren',
    'Rechazar y suscribirse',
  ])('never clicks consent-or-pay rejects: %s', (t) => expect(isRejectButtonText(t)).toBe(false));

  it('is case- and whitespace-insensitive', () => {
    expect(isRejectButtonText('  I DO NOT AGREE \n')).toBe(true);
  });

  it('ignores unrelated buttons', () => {
    expect(isRejectButtonText('Manage options')).toBe(false);
    expect(isRejectButtonText('No, take me to settings')).toBe(false);
    expect(isRejectButtonText('')).toBe(false);
  });
});
