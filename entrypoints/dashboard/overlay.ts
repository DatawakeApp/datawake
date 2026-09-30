import { el } from './dom';
import { icon } from '../../lib/ui/icons';

let host: HTMLElement | null = null;
const history: HTMLElement[] = [];

function ensure(): HTMLElement {
  if (host) return host;
  host = el('div', { class: 'overlay is-hidden', role: 'dialog', 'aria-modal': 'true' });
  host.addEventListener('click', (e) => {
    if (e.target === host) closeOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (history.length > 0) popOverlay();
      else closeOverlay();
    }
  });
  document.body.appendChild(host);
  return host;
}

function buildSheet(content: HTMLElement, showBack: boolean): HTMLElement {
  const sheet = el('div', { class: 'sheet' });

  if (showBack) {
    const back = el('button', { class: 'sheet-back', type: 'button', 'aria-label': 'Back' });
    back.append(icon('chevron-left', 16), el('span', {}, 'Back'));
    back.addEventListener('click', popOverlay);
    sheet.append(back);
  }

  const close = el('button', { class: 'sheet-x', type: 'button', 'aria-label': 'Close' });
  close.append(icon('x', 18));
  close.addEventListener('click', closeOverlay);
  sheet.append(close, content);
  return sheet;
}

export function openOverlay(content: HTMLElement): void {
  const h = ensure();

  // If already open, push current sheet onto history stack
  const existing = h.querySelector('.sheet');
  if (existing && !h.classList.contains('is-hidden')) {
    history.push(existing as HTMLElement);
  }

  h.replaceChildren(buildSheet(content, history.length > 0));
  h.classList.remove('is-hidden');
}

function popOverlay(): void {
  if (!host || history.length === 0) return;
  const prev = history.pop()!;
  // If we're going back to the root, remove the back button
  if (history.length === 0) {
    prev.querySelector('.sheet-back')?.remove();
  }
  host.replaceChildren(prev);
}

export function closeOverlay(): void {
  if (host) {
    host.classList.add('is-hidden');
    host.replaceChildren();
    history.length = 0;
  }
}
