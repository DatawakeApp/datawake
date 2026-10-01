import { describe, it, expect } from 'vitest';
import { badgeFor, BADGE_NEUTRAL, BADGE_ALERT } from '../lib/ui/badge';

describe('badgeFor', () => {
  it('shows the tracker count in a neutral colour', () => {
    expect(badgeFor({ trackers: 9, caughtAfterReject: false })).toEqual({ text: '9', color: BADGE_NEUTRAL });
  });

  it('is empty when there is nothing to report', () => {
    expect(badgeFor({ trackers: 0, caughtAfterReject: false }).text).toBe('');
  });

  it('turns red when the site tracked you after you said no', () => {
    expect(badgeFor({ trackers: 9, caughtAfterReject: true })).toEqual({ text: '9', color: BADGE_ALERT });
  });

  it('shows "!" when caught but no known trackers are counted (e.g. first-party fingerprinting)', () => {
    expect(badgeFor({ trackers: 0, caughtAfterReject: true })).toEqual({ text: '!', color: BADGE_ALERT });
  });

  it('caps large counts so the badge stays readable', () => {
    expect(badgeFor({ trackers: 140, caughtAfterReject: false }).text).toBe('99+');
  });
});
