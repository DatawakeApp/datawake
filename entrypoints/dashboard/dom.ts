/** Tiny DOM builder so section code stays declarative and readable. */
export function el(
  tag: string,
  props: Record<string, any> = {},
  ...children: (Node | string)[]
): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'class') node.className = String(v);
    else if (k === 'style') node.setAttribute('style', String(v));
    else if (k === 'textContent') node.textContent = String(v);
    else if (k in node) (node as any)[k] = v;
    else node.setAttribute(k, String(v));
  }
  for (const c of children) node.append(c);
  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

export function toast(msg: string, kind: 'ok' | 'err' = 'ok', ms = 2400): void {
  const t = document.createElement('div');
  t.className = `toast toast-${kind}`;
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}
