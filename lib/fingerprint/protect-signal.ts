/**
 * How the fingerprint-protection switch reaches fp-probe without leaving anything a page can read.
 * Both scripts run in the page at document_start, before any page script, in either order:
 *  - switch first: it sets a flag on window, which fp-probe takes and deletes straight away;
 *  - fp-probe first: it listens for an event, which the switch dispatches (and fp-probe cancels,
 *    telling the switch not to leave the flag).
 */
export const PROTECT_EVENT = 'dw-fpp-a7c2';
export const PROTECT_FLAG = '__dwFppA7c2';
