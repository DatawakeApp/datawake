/** First-run checklist on the overview: three steps that tick themselves off, then it goes away. */
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { checklist } from '../../../lib/onboarding/checklist';
import { getSettings, saveSettings } from '../../../lib/settings';

/** Whether the icon is pinned, where the browser can tell (Chrome); null elsewhere. */
async function isPinned(): Promise<boolean | null> {
  const action = browser.action as unknown as { getUserSettings?: () => Promise<{ isOnToolbar?: boolean }> };
  try {
    const s = await action.getUserSettings?.();
    return typeof s?.isOnToolbar === 'boolean' ? s.isOnToolbar : null;
  } catch {
    return null;
  }
}

export async function checklistWidget(visited: boolean, redraw: () => void): Promise<HTMLElement | null> {
  const s = await getSettings();
  if (s.checklistDismissed) return null;
  const c = checklist({ pinned: await isPinned(), visited: visited || s.siteVisited, popupOpened: s.popupOpened, pinConfirmed: s.pinConfirmed });
  if (c.done) return null;

  const done = c.steps.filter((x) => x.done).length;
  const box = el('section', { class: 'widget checklist' });
  const close = el('button', { class: 'checklist-close', type: 'button', 'aria-label': 'Hide this checklist' }, icon('x', 16));
  close.addEventListener('click', () => void saveSettings({ checklistDismissed: true }).then(redraw));
  box.append(el('div', { class: 'widget-h checklist-h' }, el('span', {}, `Get started · ${done} of ${c.steps.length}`), close));

  const list = el('ol', { class: 'checklist-list widget-body' });
  for (const step of c.steps) {
    const item = el('li', { class: 'checklist-item' + (step.done ? ' done' : '') });
    item.append(
      el('span', { class: 'checklist-mark', 'aria-hidden': 'true' }, step.done ? icon('check', 13) : ''),
      el('div', { class: 'checklist-text' }, el('span', { class: 'checklist-title' }, step.title), el('span', { class: 'checklist-hint' }, step.hint)),
    );
    if (step.manual && !step.done) {
      const btn = el('button', { class: 'btn secondary small', type: 'button' }, 'Done');
      btn.addEventListener('click', () => void saveSettings({ pinConfirmed: true }).then(redraw));
      item.append(btn);
    }
    list.append(item);
  }
  box.append(list);
  return box;
}
