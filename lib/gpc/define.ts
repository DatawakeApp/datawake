/**
 * Global Privacy Control, the `navigator.globalPrivacyControl` JS signal.
 *
 * It must be defined on the *page's* navigator. Content scripts run in an isolated world with
 * their own navigator wrapper, so defining it there is invisible to the site. Instead:
 *  - Chrome MV3: gpc.content.ts runs in the MAIN world and passes `navigator`.
 *  - Firefox MV2: content.ts passes `window.wrappedJSObject.navigator` and wraps the getter with
 *    `exportFunction` so page code may call it.
 *
 * The property must exist before page scripts run (document_start), but the user's setting lives
 * in async extension storage. So it's a *live getter*: it defaults to on (matching the settings
 * default) and follows the setting once known, including later toggles.
 *
 * (The `Sec-GPC: 1` HTTP header is separate, see syncGpcRuleset in background.ts.)
 */

/** Attribute on <html> through which the isolated content script tells the MAIN world "GPC off". */
export const GPC_ATTR = 'data-dw-gpc';

/** On unless the isolated content script has explicitly set the attribute to "0". */
export function gpcEnabledFromAttr(value: string | null): boolean {
  return value !== '0';
}

type GetterWrapper = <T extends (...args: never[]) => unknown>(fn: T) => T;

/**
 * Define `globalPrivacyControl` on `nav` as a getter backed by `isEnabled`. Returns false (never
 * throws) if the property can't be redefined, e.g. the browser or another extension locked it.
 */
export function defineGpcGetter(
  nav: object,
  isEnabled: () => boolean,
  wrapGetter: GetterWrapper = (fn) => fn,
): boolean {
  try {
    Object.defineProperty(nav, 'globalPrivacyControl', {
      get: wrapGetter(() => isEnabled()),
      configurable: true,
      enumerable: true,
    });
    return true;
  } catch {
    return false;
  }
}
