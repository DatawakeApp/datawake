import { describe, it, expect, vi, afterEach } from 'vitest';
import fixtures from './fixtures/tc-strings.json';
import { countDisclosedVendors } from '../lib/tcf/disclosed';
import { vendorCountFromTcData, startTcfProbe, type TcData } from '../lib/tcf/probe';

// Real TC strings captured 2026-09-25 after Datawake auto-rejected (no personal data: consent
// choices + vendor lists only). Counts cross-checked: Wallapop's 1024 equals the key-count method.
describe('countDisclosedVendors', () => {
  it.each([
    ['es.wallapop.com', 1024],
    ['www.marca.com', 1020],
    ['www.lequipe.fr', 231],
  ])('decodes the DisclosedVendors segment: %s → %i', (host, n) => {
    expect(countDisclosedVendors((fixtures as Record<string, string>)[host])).toBe(n);
  });

  it('returns null when there is no DisclosedVendors segment', () => {
    const coreOnly = (fixtures as Record<string, string>)['www.lequipe.fr'].split('.')[0];
    expect(countDisclosedVendors(coreOnly)).toBeNull();
  });

  it('returns null for empty or garbage input, never throws', () => {
    expect(countDisclosedVendors('')).toBeNull();
    expect(countDisclosedVendors(undefined)).toBeNull();
    expect(countDisclosedVendors('!!!.@@@')).toBeNull();
    expect(countDisclosedVendors('CQ.I')).toBeNull(); // truncated segment
  });

  it('decodes range-encoded segments', () => {
    // type=1 (001), maxVendorId=10, isRange=1, numEntries=2: [range 1..3], [single 7] → 4 vendors
    const bits =
      '001' + (10).toString(2).padStart(16, '0') + '1' + (2).toString(2).padStart(12, '0') +
      '1' + (1).toString(2).padStart(16, '0') + (3).toString(2).padStart(16, '0') +
      '0' + (7).toString(2).padStart(16, '0');
    const padded = bits.padEnd(Math.ceil(bits.length / 6) * 6, '0');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const seg = padded.match(/.{6}/g)!.map((b) => alphabet[parseInt(b, 2)]).join('');
    expect(countDisclosedVendors(`CORE.${seg}`)).toBe(4);
  });
});

describe('vendorCountFromTcData', () => {
  it('uses the larger of the vendor-map keys and the disclosed segment', () => {
    const tc = (fixtures as Record<string, string>)['www.marca.com'];
    expect(vendorCountFromTcData({ tcString: tc, vendor: { consents: {}, legitimateInterests: {} } })).toBe(1020);
    expect(vendorCountFromTcData({ vendor: { consents: { 1: false, 2: false }, legitimateInterests: { 3: true } } })).toBe(3);
    expect(vendorCountFromTcData({})).toBe(0);
  });
});

describe('startTcfProbe', () => {
  afterEach(() => vi.useRealTimers());

  function fakeTcfApi() {
    let listener: ((d: TcData, ok: boolean) => void) | null = null;
    const api = vi.fn((cmd: string, _v: number, cb: (d: TcData, ok: boolean) => void) => {
      if (cmd === 'addEventListener') listener = cb;
    });
    return { api, emit: (d: TcData) => listener?.(d, true) };
  }

  it('reports READY on the first CMP event, and counts only when they grow', () => {
    vi.useFakeTimers();
    const { api, emit } = fakeTcfApi();
    const post = vi.fn();
    startTcfProbe({ getWindow: () => ({ __tcfapi: api }), post });
    vi.advanceTimersByTime(250);

    emit({ eventStatus: 'loading' });
    expect(post).not.toHaveBeenCalled();

    emit({ eventStatus: 'cmpuishown', vendor: { consents: {} } });
    expect(post).toHaveBeenLastCalledWith({ ready: true, count: 0 });

    const tc = (fixtures as Record<string, string>)['www.marca.com'];
    emit({ eventStatus: 'useractioncomplete', tcString: tc }); // after our reject
    expect(post).toHaveBeenLastCalledWith({ ready: true, count: 1020 });

    post.mockClear();
    emit({ eventStatus: 'useractioncomplete', tcString: tc }); // same count again → no repost
    expect(post).not.toHaveBeenCalled();
  });

  it('waits for a late __tcfapi and gives up after the timeout', () => {
    vi.useFakeTimers();
    const win: Record<string, unknown> = {};
    const post = vi.fn();
    startTcfProbe({ getWindow: () => win, post });
    vi.advanceTimersByTime(20_000);
    const { api } = fakeTcfApi();
    win.__tcfapi = api;
    vi.advanceTimersByTime(1000);
    expect(api).not.toHaveBeenCalled();
  });

  it('passes the callback through wrapCallback (Firefox exportFunction)', () => {
    vi.useFakeTimers();
    const { api } = fakeTcfApi();
    const wrap = vi.fn(<T>(fn: T) => fn);
    startTcfProbe({ getWindow: () => ({ __tcfapi: api }), post: vi.fn(), wrapCallback: wrap });
    vi.advanceTimersByTime(250);
    expect(wrap).toHaveBeenCalledOnce();
  });
});
