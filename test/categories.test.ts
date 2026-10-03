import { describe, it, expect } from 'vitest';
import { categoryMeta } from '../lib/trackers/categories';

describe('categoryMeta', () => {
  it('gives tag managers their own label instead of Other', () => {
    expect(categoryMeta('Tag manager').label).toBe('Tag manager');
    expect(categoryMeta('Tag manager').impact).toBe('Medium');
  });
  it('falls back to Other for unknown categories', () => {
    expect(categoryMeta('Badge').label).toBe('Other');
    expect(categoryMeta(undefined).label).toBe('Other');
  });
});
