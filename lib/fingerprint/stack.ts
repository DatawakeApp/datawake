/**
 * Which page script made this call? Parses an `Error().stack` (V8 or SpiderMonkey) captured inside our API wrapper and
 * returns the first frame that isn't the extension itself, the caller, without query/hash (which
 * can carry tokens). For eval'd code the stack names the script that called eval, which is the
 * right owner. Inline scripts resolve to the page URL.
 */
const URL_RE = /(https?:\/\/[^\s)]+?)(?::\d+){1,2}(?=[)\s]|$)/;
const EXTENSION_RE = /(chrome|moz|safari-web)-extension:\/\//;

export function callerScript(stack: string | null | undefined): string | null {
  if (!stack) return null;
  for (const line of stack.split('\n')) {
    const location = frameLocation(line);
    if (!location || EXTENSION_RE.test(location)) continue; // our own wrapper frames
    const m = URL_RE.exec(location);
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

/**
 * Where a stack frame points, in either engine's format, with eval'd code mapped to its caller:
 *   V8:          "    at fn (https://x/a.js:1:2)"   eval: "at eval (eval at f (https://x/a.js:1:2), ...)"
 *   SpiderMonkey: "fn@https://x/a.js:1:2"            eval: "@https://x/a.js line 5 > eval:1:1"
 */
function frameLocation(line: string): string | null {
  if (line.includes(' at ')) {
    // For eval'd code only the part before "(eval at" is this frame's own location.
    return EXTENSION_RE.test(line.split('(eval at')[0]) ? null : line;
  }
  const at = line.indexOf('@');
  if (at < 0) return null;
  const location = line.slice(at + 1);
  const evalIdx = location.indexOf(' line ');
  // "<url> line N > eval:1:1": the script that called eval; add a fake position for URL_RE.
  return evalIdx >= 0 ? `${location.slice(0, evalIdx)}:${location.slice(evalIdx + 6).split(' ')[0]}` : location;
}
