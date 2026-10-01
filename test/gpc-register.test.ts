import { describe, it, expect, vi } from 'vitest';
import { syncGpcScript, GPC_SCRIPT, type ScriptingApi } from '../lib/gpc/register';

function fakeScripting(registered: string[] = []): ScriptingApi & { ids: Set<string> } {
  const ids = new Set(registered);
  return {
    ids,
    getRegisteredContentScripts: vi.fn(async ({ ids: q }: { ids: string[] }) =>
      q.filter((id) => ids.has(id)).map((id) => ({ id })),
    ),
    registerContentScripts: vi.fn(async (scripts: { id: string }[]) => {
      for (const s of scripts) {
        if (ids.has(s.id)) throw new Error(`Duplicate script ID '${s.id}'`);
        ids.add(s.id);
      }
    }),
    unregisterContentScripts: vi.fn(async ({ ids: q }: { ids: string[] }) => {
      for (const id of q) ids.delete(id);
    }),
  };
}

describe('syncGpcScript', () => {
  it('registers the MAIN-world GPC script in every frame at document_start when enabled', async () => {
    const s = fakeScripting();
    await syncGpcScript(s, true);
    expect(s.ids.has(GPC_SCRIPT.id)).toBe(true);
    expect(s.registerContentScripts).toHaveBeenCalledWith([
      expect.objectContaining({ world: 'MAIN', runAt: 'document_start', allFrames: true }),
    ]);
  });

  it('is idempotent, does not re-register an already registered script', async () => {
    const s = fakeScripting([GPC_SCRIPT.id]);
    await syncGpcScript(s, true);
    expect(s.registerContentScripts).not.toHaveBeenCalled();
  });

  it('unregisters when disabled', async () => {
    const s = fakeScripting([GPC_SCRIPT.id]);
    await syncGpcScript(s, false);
    expect(s.ids.has(GPC_SCRIPT.id)).toBe(false);
  });

  it('does nothing when disabled and not registered', async () => {
    const s = fakeScripting();
    await syncGpcScript(s, false);
    expect(s.unregisterContentScripts).not.toHaveBeenCalled();
  });

  it('is a no-op without a scripting API', async () => {
    await expect(syncGpcScript(undefined, true)).resolves.toBeUndefined();
  });

  it('swallows API errors (best-effort, never breaks background startup)', async () => {
    const s = fakeScripting();
    s.getRegisteredContentScripts = vi.fn(async () => {
      throw new Error('boom');
    });
    await expect(syncGpcScript(s, true)).resolves.toBeUndefined();
  });
});
