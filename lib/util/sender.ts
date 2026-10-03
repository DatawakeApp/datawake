/** Checks on who sent a runtime message, and on values relayed from web pages. */

interface Sender {
  url?: string;
  tab?: unknown;
}

/** True for Datawake's own pages (popup, dashboard), never for content scripts on web pages. */
export function isExtensionPage(sender: Sender | undefined, extensionBase: string): boolean {
  return typeof sender?.url === 'string' && sender.url.startsWith(extensionBase);
}

/** The IAB's vendor list has about a thousand vendors; anything far beyond is not a real count. */
const MAX_TCF_VENDORS = 5_000;

export function validTcfCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_TCF_VENDORS) return null;
  return Math.floor(value);
}
