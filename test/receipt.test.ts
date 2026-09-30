import { describe, it, expect } from 'vitest';
import { toReceiptData, shortCompanyName } from '../lib/receipt/model';
import { receiptCaption, receiptTitle, receiptFileName } from '../lib/receipt/caption';

// A fixed instant so date/time labels are deterministic: 12 July 2026, 14:07 UTC.
const TS = Date.UTC(2026, 6, 12, 14, 7, 0);

const cookies = [
  { name: '_ga', domain: 'google-analytics.com' },
  { name: 'IDE', domain: 'doubleclick.net' },
  { name: '_fbp', domain: 'facebook.com' },
];

describe('shortCompanyName', () => {
  it('strips parenthetical owners', () => {
    expect(shortCompanyName('Google (Alphabet)')).toBe('Google');
  });
  it('drops corporate suffixes', () => {
    expect(shortCompanyName('Criteo SA')).toBe('Criteo');
    expect(shortCompanyName('Amazon Technologies Inc.')).toBe('Amazon Technologies');
  });
  it('leaves a bare domain untouched', () => {
    expect(shortCompanyName('example-tracker.com')).toBe('example-tracker.com');
  });
});

describe('toReceiptData', () => {
  it('counts cookies and companies', () => {
    const d = toReceiptData({ site: 'brand.com', timestamp: TS, newCookies: cookies });
    expect(d.site).toBe('brand.com');
    expect(d.cookieCount).toBe(3);
    // _ga+IDE both resolve to Google, _fbp to Meta → 2 companies.
    expect(d.companyCount).toBe(2);
    expect(d.companies.length).toBeGreaterThan(0);
  });

  it('collapses a long company list into a +N tail', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ name: `c${i}`, domain: `tracker${i}.example` }));
    const d = toReceiptData({ site: 'brand.com', timestamp: TS, newCookies: many });
    expect(d.companies.length).toBe(3);
    expect(d.moreCompanies).toBe(d.companyCount - 3);
    expect(d.moreCompanies).toBeGreaterThan(0);
  });

  it('produces human date + 24h time labels', () => {
    const d = toReceiptData({ site: 'brand.com', timestamp: TS, newCookies: cookies });
    expect(d.dateLabel).toMatch(/2026/);
    expect(d.dateLabel).toMatch(/July/);
    expect(d.timeLabel).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('receiptCaption', () => {
  const d = toReceiptData({ site: 'brand.com', timestamp: TS, newCookies: cookies });

  it('names the site and under-claims legality', () => {
    const cap = receiptCaption(d);
    expect(cap).toContain('brand.com');
    expect(cap).toContain('may be illegal'); // never assert "is illegal"
    expect(cap).not.toMatch(/\bis illegal\b/);
  });

  it('ends on an action (the install link + hashtag)', () => {
    const cap = receiptCaption(d);
    expect(cap).toContain('datawake.app');
    expect(cap).toContain('#CaughtByDatawake');
  });

  it('pluralizes correctly for a single cookie', () => {
    const one = toReceiptData({ site: 'brand.com', timestamp: TS, newCookies: [cookies[0]] });
    const cap = receiptCaption(one);
    expect(cap).toContain('1 tracking cookie ');
    expect(cap).not.toContain('1 tracking cookies');
  });
});

describe('receipt helpers', () => {
  const d = toReceiptData({ site: 'brand.com', timestamp: TS, newCookies: cookies });

  it('titles the receipt', () => {
    expect(receiptTitle(d)).toContain('brand.com');
    expect(receiptTitle(d)).toContain('Reject');
  });

  it('builds a safe png filename', () => {
    expect(receiptFileName(d)).toBe('datawake-caught-brand-com.png');
    const weird = toReceiptData({ site: 'a b.co.uk!', timestamp: TS, newCookies: cookies });
    expect(receiptFileName(weird)).toMatch(/^datawake-caught-[a-z0-9-]+\.png$/);
  });
});
