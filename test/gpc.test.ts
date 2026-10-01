import { describe, it, expect } from 'vitest';
import { defineGpcGetter, GPC_ATTR, gpcEnabledFromAttr } from '../lib/gpc/define';

describe('defineGpcGetter', () => {
  it('exposes globalPrivacyControl as a live getter', () => {
    const nav = {} as { globalPrivacyControl?: boolean };
    let enabled = true;
    expect(defineGpcGetter(nav, () => enabled)).toBe(true);
    expect(nav.globalPrivacyControl).toBe(true);
    enabled = false;
    expect(nav.globalPrivacyControl).toBe(false);
  });

  it('is enumerable, like the native property', () => {
    const nav = {};
    defineGpcGetter(nav, () => true);
    expect(Object.keys(nav)).toContain('globalPrivacyControl');
  });

  it('returns false instead of throwing if the property is already locked', () => {
    const nav = Object.defineProperty({}, 'globalPrivacyControl', { value: true, configurable: false });
    expect(defineGpcGetter(nav, () => false)).toBe(false);
  });
});

describe('gpcEnabledFromAttr', () => {
  it('defaults to on until the content script says otherwise', () => {
    expect(gpcEnabledFromAttr(null)).toBe(true);
    expect(gpcEnabledFromAttr('1')).toBe(true);
    expect(gpcEnabledFromAttr('0')).toBe(false);
  });

  it('uses a data- attribute name', () => {
    expect(GPC_ATTR).toMatch(/^data-dw-/);
  });
});
