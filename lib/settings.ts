import { browser } from 'wxt/browser';

export interface Settings {
  name: string;
  email: string;
  address: string;
  paused: boolean;
  pausedSites: string[];
  gpcEnabled: boolean;
  autoRejectEnabled: boolean;
  onboarded: boolean;
}

const KEY = 'settings';
const DEFAULTS: Settings = {
  name: '',
  email: '',
  address: '',
  paused: false,
  pausedSites: [],
  gpcEnabled: true,
  autoRejectEnabled: true,
  onboarded: false,
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(KEY);
  return { ...DEFAULTS, ...((stored?.[KEY] as Partial<Settings>) ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await browser.storage.local.set({ [KEY]: next });
  return next;
}

export function hasIdentity(s: Settings): boolean {
  return s.name.trim().length > 0 && /\S+@\S+\.\S+/.test(s.email);
}

export async function toggleSitePause(site: string): Promise<boolean> {
  const s = await getSettings();
  const sites = s.pausedSites ?? [];
  const idx = sites.indexOf(site);
  const next = idx === -1 ? [...sites, site] : sites.filter((x) => x !== site);
  await saveSettings({ pausedSites: next });
  return idx === -1;
}
