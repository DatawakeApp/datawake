import { describe, it, expect } from 'vitest';
import { padDaily } from '../lib/ui/pad-daily';

describe('padDaily', () => {
  const now = new Date('2026-09-30T12:00:00Z').getTime();

  it('returns one entry per day for the whole window, filling gaps with zero', () => {
    const out = padDaily([{ day: '2026-09-30', count: 5 }, { day: '2026-09-28', count: 2 }], 5, now);
    expect(out.map((d) => d.day)).toEqual(['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30']);
    expect(out.map((d) => d.count)).toEqual([0, 0, 2, 0, 5]);
  });

  it('ignores days outside the window', () => {
    const out = padDaily([{ day: '2026-01-01', count: 9 }], 3, now);
    expect(out.reduce((s, d) => s + d.count, 0)).toBe(0);
  });
});
