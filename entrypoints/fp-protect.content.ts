/**
 * Fingerprint protection switch, MAIN world. Not in the manifest: the background registers it
 * only while protection is on in Settings (lib/gpc/register.ts), so it is simply absent otherwise.
 * The noise itself lives in fp-probe (lib/fingerprint/instrument.ts); see protect-signal.ts.
 */
import { PROTECT_EVENT, PROTECT_FLAG } from '../lib/fingerprint/protect-signal';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: true,
  registration: 'runtime',
  main() {
    const handled = !document.dispatchEvent(new CustomEvent(PROTECT_EVENT, { cancelable: true }));
    if (!handled) Object.defineProperty(window, PROTECT_FLAG, { value: true, configurable: true });
  },
});
