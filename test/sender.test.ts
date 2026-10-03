import { describe, it, expect } from 'vitest';
import { isExtensionPage, validTcfCount } from '../lib/util/sender';

const BASE = 'chrome-extension://abc/';

describe('isExtensionPage', () => {
  it('accepts the popup and the dashboard', () => {
    expect(isExtensionPage({ url: 'chrome-extension://abc/popup.html' }, BASE)).toBe(true);
    expect(isExtensionPage({ url: 'chrome-extension://abc/dashboard.html#sites', tab: { id: 3 } }, BASE)).toBe(true);
  });

  it('rejects content scripts on web pages and other extensions', () => {
    expect(isExtensionPage({ url: 'https://evil.example/', tab: { id: 3 } }, BASE)).toBe(false);
    expect(isExtensionPage({ url: 'chrome-extension://other/popup.html' }, BASE)).toBe(false);
    expect(isExtensionPage({}, BASE)).toBe(false);
    expect(isExtensionPage(undefined, BASE)).toBe(false);
  });
});

describe('validTcfCount', () => {
  it('accepts realistic vendor counts', () => {
    expect(validTcfCount(1029)).toBe(1029);
    expect(validTcfCount(12.7)).toBe(12);
  });
  it('rejects nonsense a page could post', () => {
    expect(validTcfCount(1e9)).toBeNull();
    expect(validTcfCount(-3)).toBeNull();
    expect(validTcfCount(Number.NaN)).toBeNull();
    expect(validTcfCount('50')).toBeNull();
  });
});
