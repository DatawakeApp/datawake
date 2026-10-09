import { describe, it, expect } from 'vitest';
import { checklist } from '../lib/onboarding/checklist';

describe('checklist', () => {
  it('lists the three first steps in order', () => {
    const c = checklist({ pinned: false, visited: false, popupOpened: false, pinConfirmed: false });
    expect(c.steps.map((s) => s.id)).toEqual(['pin', 'visit', 'popup']);
    expect(c.done).toBe(false);
  });

  it('counts pinning as done when the browser says so, or the user confirms', () => {
    expect(checklist({ pinned: true, visited: false, popupOpened: false, pinConfirmed: false }).steps[0].done).toBe(true);
    expect(checklist({ pinned: null, visited: false, popupOpened: false, pinConfirmed: true }).steps[0].done).toBe(true);
  });

  it('only offers a manual tick for pinning when the browser cannot tell', () => {
    expect(checklist({ pinned: null, visited: false, popupOpened: false, pinConfirmed: false }).steps[0].manual).toBe(true);
    expect(checklist({ pinned: false, visited: false, popupOpened: false, pinConfirmed: false }).steps[0].manual).toBe(false);
  });

  it('is done when every step is', () => {
    expect(checklist({ pinned: true, visited: true, popupOpened: true, pinConfirmed: false }).done).toBe(true);
  });
});
