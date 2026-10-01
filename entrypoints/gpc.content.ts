/**
 * Global Privacy Control JS signal, MAIN world.
 *
 * Defines `navigator.globalPrivacyControl` on the page's own navigator (an isolated-world
 * definition is invisible to the site). MAIN world can't read extension storage, so the getter
 * reads a live gate the isolated content script sets on <html>, see lib/gpc/define.ts, so a
 * toggle takes effect on already-open pages too.
 */
import { defineGpcGetter, GPC_ATTR, gpcEnabledFromAttr } from '../lib/gpc/define';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: true,
  // Not in the manifest: background.ts registers it only while GPC is on (lib/gpc/register.ts),
  // so sites never see the signal before the user's setting is known.
  registration: 'runtime',
  main() {
    defineGpcGetter(navigator, () =>
      gpcEnabledFromAttr(document.documentElement.getAttribute(GPC_ATTR)),
    );
  },
});
