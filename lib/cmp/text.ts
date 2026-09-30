/**
 * Is this button's text a "reject consent" action we may click on the user's behalf?
 * Used by the DOM-clicking auto-reject fallback (content.ts). Multilingual: EN/ES/DE/FR/IT.
 *
 * Three rules, in order:
 *  1. Never click a consent-or-pay reject ("Reject and subscribe"): it commits the user to a
 *     paywall flow, which is not what auto-reject should decide for them.
 *  2. Negated accepts ("I do not agree", "No acepto", "Continue without accepting") are rejects,
 *     even though they contain an accept word.
 *  3. Otherwise: starts with a reject phrase and contains no accept word.
 */

const PAY_OR_OK =
  /subscri|purchase|\bbuy\b|\bpay\b|abbona|abonn|abonnier|\babo\b|suscrib|comprar|acquist|kaufen|\bpagar\b|\bpaga(re)?\b|\bpayer\b|bezahl|[€£]\s?\d|\d\s?[€£]|\/\s?(month|mes|mese|mois|monat)\b/i;

// Existing-subscriber sign-in links ("Already subscribed? Sign in") mention subscribing but aren't a
// pay option.
const SIGN_IN =
  /sign in|log ?in|already|se connecter|déjà|deja|anmelden|bereits|accedi|già|inicia(r)? sesi[oó]n|ya eres/i;

// Accept buttons start with an accept word ("Alle akzeptieren", "Tout accepter" included), so a
// headline that merely contains "continue" doesn't count.
const ACCEPT_START =
  /^(accept|i accept|agree|i agree|allow|ok\b|okay|got it|consent|continue|yes|acepto|aceptar|permitir|de acuerdo|consentir|alle akzeptieren|akzeptieren|alle zustimmen|zustimmen|einverstanden|tout accepter|accepter|j['’]accepte|accetta|accetto)/i;
const MAX_ACCEPT_LABEL = 40;

// Loose "reject" stem, for spotting combined reject-and-pay buttons ("Rechazo y me suscribo").
const REJECT_STEM = /\b(reject|refus|rechaz|rifiut|ablehn|decline|deny|do not agree|don['’]t agree)/i;

const NEGATED_ACCEPT =
  /^(i do not agree|i don't agree|i don’t agree|do not agree|don't agree|don’t agree|i disagree|no acepto|no aceptar|continue without accepting|continuer sans accepter|continua senza accettare|continuar sin aceptar|seguir sin aceptar|weiter ohne (zustimmung|einwilligung|akzeptieren)|non accetto|je refuse)\b/i;

const REJECT =
  /^(reject all|reject|decline all|decline|refuse all|deny all|deny|opt out of all|no thanks|disagree|rechazar todo|rechazar|denegar|alle ablehnen|ablehnen|tout refuser|refuser|rifiuta tutto|rifiuta)\b/i;

// Word-bounded so short tokens don't match inside other words ("ok" in "cookies").
const ACCEPT =
  /\b(accept|agree|allow|ok|okay|got it|continue|yes|aceptar|acepto|permitir|de acuerdo|consentir|akzeptieren|zustimmen|accepter|accetta)/i;

const normalize = (raw: string): string => raw.trim().replace(/\s+/g, ' ');

/** A consent-or-pay button ("Reject and subscribe"), never auto-click, even via a CMP selector. */
export function isPayOrOkText(raw: string): boolean {
  const text = normalize(raw);
  return PAY_OR_OK.test(text) && !SIGN_IN.test(text);
}

export function isRejectButtonText(raw: string): boolean {
  const text = normalize(raw);
  if (!text || PAY_OR_OK.test(text)) return false;
  if (NEGATED_ACCEPT.test(text)) return true;
  return REJECT.test(text) && !ACCEPT.test(text);
}

/** An accept-consent button ("Accept all", "Consent and continue", "Acepto y continúo gratis"). */
export function isAcceptButtonText(raw: string): boolean {
  const text = normalize(raw);
  return (
    text.length <= MAX_ACCEPT_LABEL &&
    ACCEPT_START.test(text) &&
    !NEGATED_ACCEPT.test(text) &&
    !REJECT_STEM.test(text)
  );
}

/** A single button that rejects AND commits to paying ("Rifiuta e abbonati"). */
export function isRejectAndPayText(raw: string): boolean {
  const text = normalize(raw);
  return REJECT_STEM.test(text) && isPayOrOkText(text);
}
