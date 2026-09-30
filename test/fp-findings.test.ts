import { describe, it, expect } from 'vitest';
import { addFpReport, parseFpReport, type FpContext } from '../lib/fingerprint/findings';

const ctx = (over: Partial<FpContext> = {}): FpContext => ({
  site: 'shop.example',
  rejectedAt: null,
  domainOf: (url) => new URL(url).hostname.split('.').slice(-2).join('.'),
  companyOf: (d) => (d === 'fpjs.example' ? 'FingerprintJS' : null),
  ...over,
});

describe('addFpReport', () => {
  it('groups techniques by script domain, with the company behind it', () => {
    let f = addFpReport([], { script: 'https://cdn.fpjs.example/a.js', technique: 'canvas', at: 10 }, ctx());
    f = addFpReport(f, { script: 'https://api.fpjs.example/b.js', technique: 'audio', at: 11 }, ctx());
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ domain: 'fpjs.example', company: 'FingerprintJS', firstParty: false, techniques: ['canvas', 'audio'], firstSeenAt: 10 });
  });

  it('marks the site’s own scripts as first-party', () => {
    const f = addFpReport([], { script: 'https://www.shop.example/app.js', technique: 'fonts', at: 1 }, ctx());
    expect(f[0].firstParty).toBe(true);
  });

  it('flags findings that happened after the user rejected', () => {
    let f = addFpReport([], { script: 'https://cdn.fpjs.example/a.js', technique: 'canvas', at: 5 }, ctx({ rejectedAt: 100 }));
    expect(f[0].afterReject).toBe(false);
    f = addFpReport(f, { script: 'https://cdn.fpjs.example/a.js', technique: 'audio', at: 150 }, ctx({ rejectedAt: 100 }));
    expect(f[0].afterReject).toBe(true);
  });

  it('does not mutate the input', () => {
    const before = addFpReport([], { script: 'https://cdn.fpjs.example/a.js', technique: 'canvas', at: 1 }, ctx());
    const snapshot = JSON.stringify(before);
    addFpReport(before, { script: 'https://cdn.fpjs.example/a.js', technique: 'audio', at: 2 }, ctx());
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('does not duplicate a technique', () => {
    let f = addFpReport([], { script: 'https://cdn.fpjs.example/a.js', technique: 'canvas', at: 1 }, ctx());
    f = addFpReport(f, { script: 'https://cdn.fpjs.example/other.js', technique: 'canvas', at: 2 }, ctx());
    expect(f[0].techniques).toEqual(['canvas']);
  });
});

describe('parseFpReport (messages come from page-reachable code, validate)', () => {
  it('accepts a well-formed report', () => {
    expect(parseFpReport({ script: 'https://a.example/x.js', technique: 'webgl', at: 5 })).toEqual({
      script: 'https://a.example/x.js', technique: 'webgl', at: 5,
    });
  });

  it.each([
    [null],
    [{ script: 'javascript:alert(1)', technique: 'canvas', at: 1 }],
    [{ script: 'https://a.example/x.js', technique: 'mind-reading', at: 1 }],
    [{ script: 'https://a.example/x.js', technique: 'canvas', at: 'soon' }],
    [{ script: 'x'.repeat(3000), technique: 'canvas', at: 1 }],
  ])('rejects malformed input %#', (raw) => {
    expect(parseFpReport(raw)).toBeNull();
  });
});
