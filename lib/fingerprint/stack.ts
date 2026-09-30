/**
 * Which page script made this call? Parses a V8 `Error().stack` captured inside our API wrapper and
 * returns the first frame that isn't the extension itself, the caller, without query/hash (which
 * can carry tokens). For eval'd code the stack names the script that called eval, which is the
 * right owner. Inline scripts resolve to the page URL.
 */
const URL_RE = /(https?:\/\/[^\s)]+?)(?::\d+){1,2}(?=[)\s]|$)/;
const EXTENSION_RE = /(chrome|moz|safari-web)-extension:\/\//;

export function callerScript(stack: string | null | undefined): string | null {
  if (!stack) return null;
  for (const line of stack.split('\n')) {
    if (!line.includes(' at ') || EXTENSION_RE.test(line.split('(eval at')[0])) continue;
    const m = URL_RE.exec(line);
    if (!m) continue;
    try {
      const u = new URL(m[1]);
      return `${u.origin}${u.pathname}`;
    } catch {
      continue;
    }
  }
  return null;
}
