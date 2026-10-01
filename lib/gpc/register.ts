/**
 * Register the MAIN-world GPC script (entrypoints/gpc.content.ts) only while GPC is on.
 *
 * The user's setting lives in async storage, but sites can read `navigator.globalPrivacyControl`
 * synchronously the moment the page starts. A static content script would have to guess the
 * setting until storage answers; registering the script from the background instead means it's
 * simply absent when GPC is off, so sites never see a signal the user switched off.
 * (The live gate in lib/gpc/define.ts still handles toggling on an already-open page.)
 */

export interface RegisteredScript {
  id: string;
  js: string[];
  matches: string[];
  runAt: 'document_start';
  world: 'MAIN';
  allFrames: boolean;
}

/** The subset of `chrome.scripting` we use. */
export interface ScriptingApi {
  getRegisteredContentScripts(filter: { ids: string[] }): Promise<{ id: string }[]>;
  registerContentScripts(scripts: RegisteredScript[]): Promise<void>;
  unregisterContentScripts(filter: { ids: string[] }): Promise<void>;
}

export const GPC_SCRIPT: RegisteredScript = {
  id: 'dw-gpc',
  js: ['content-scripts/gpc.js'],
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: true, // third-party iframes read GPC too
};

/** Make the registered GPC script match `enabled`. Best-effort: never throws. */
export async function syncGpcScript(
  scripting: ScriptingApi | undefined,
  enabled: boolean,
): Promise<void> {
  if (!scripting?.registerContentScripts) return;
  try {
    const existing = await scripting.getRegisteredContentScripts({ ids: [GPC_SCRIPT.id] });
    const registered = existing.length > 0;
    if (enabled && !registered) await scripting.registerContentScripts([GPC_SCRIPT]);
    if (!enabled && registered) await scripting.unregisterContentScripts({ ids: [GPC_SCRIPT.id] });
  } catch {
    // best-effort
  }
}
