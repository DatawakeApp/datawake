import { describe, it, expect } from 'vitest';
import { humanCategory, fillFromOwner } from '../lib/trackers/radar-category';

describe('humanCategory', () => {
  it('picks the most telling category, not the alphabetically first', () => {
    expect(humanCategory(['Ad Fraud', 'Ad Motivated Tracking', 'Advertising', 'Audience Measurement'])).toBe('Advertising');
    expect(humanCategory(['Analytics', 'Session Replay'], 'hotjar.com')).toBe('Session replay');
    expect(humanCategory(['Advertising', 'Analytics', 'Audience Measurement', 'Tag Manager', 'Third-Party Analytics Marketing'])).toBe('Advertising');
    expect(humanCategory(['Tag Manager'])).toBe('Tag manager');
    expect(humanCategory(['Embedded Content', 'Social - Share'])).toBe('Social');
  });

  it('is empty without categories, Other for unmapped ones', () => {
    expect(humanCategory(undefined)).toBe('');
    expect(humanCategory([])).toBe('');
    expect(humanCategory(['Badge'])).toBe('Other');
  });
});

describe('fillFromOwner', () => {
  it("gives uncategorised domains their owner's most common category", () => {
    const rows = [
      { owner: 'Acme', category: 'Advertising' },
      { owner: 'Acme', category: 'Advertising' },
      { owner: 'Acme', category: 'Analytics' },
      { owner: 'Acme', category: '' },
      { owner: 'Solo', category: '' },
    ];
    expect(fillFromOwner(rows).map((r) => r.category)).toEqual(['Advertising', 'Advertising', 'Analytics', 'Advertising', '']);
  });

  it('does not borrow Other', () => {
    expect(fillFromOwner([{ owner: 'A', category: 'Other' }, { owner: 'A', category: '' }]).map((r) => r.category)).toEqual(['Other', '']);
  });

describe('session replay', () => {
  it('is only claimed for products built to record screens', () => {
    expect(humanCategory(['Content Delivery', 'Session Replay'], 'd.sni.global.fastly.net')).toBe('Content');
    expect(humanCategory(['Ad Motivated Tracking', 'Advertising', 'Session Replay'], 'ml314.com')).toBe('Advertising');
    expect(humanCategory([], 'clarity.ms')).toBe('Session replay');
  });

  it('is not spread to the rest of a company', () => {
    const rows = fillFromOwner([{ owner: 'Yandex', category: 'Session replay' }, { owner: 'Yandex', category: '' }]);
    expect(rows[1].category).toBe('');
  });
});

});
