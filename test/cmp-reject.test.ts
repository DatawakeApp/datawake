import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  rejectViaCmpApi,
  startCmpRejectLoop,
  createTcfGate,
  createBannerGate,
  TCF_WAIT_MS,
  BANNER_WAIT_MS,
} from '../lib/cmp/reject';

describe('rejectViaCmpApi', () => {
  it('returns null when no known CMP is on the page', () => {
    expect(rejectViaCmpApi({})).toBeNull();
    expect(rejectViaCmpApi(undefined)).toBeNull();
  });

  it('calls Consentmanager setConsent(0)', () => {
    const __cmp = vi.fn();
    expect(rejectViaCmpApi({ __cmp, cmpmngr: {} })).toBe('consentmanager');
    expect(__cmp).toHaveBeenCalledWith('setConsent', 0);
  });

  it.each([
    ['onetrust', { OneTrust: { RejectAll: vi.fn() } }, (w: any) => w.OneTrust.RejectAll],
    ['didomi', { Didomi: { setUserDisagreeToAll: vi.fn() } }, (w: any) => w.Didomi.setUserDisagreeToAll],
    ['usercentrics', { UC_UI: { denyAllConsents: vi.fn() } }, (w: any) => w.UC_UI.denyAllConsents],
    ['cookiebot', { Cookiebot: { decline: vi.fn() } }, (w: any) => w.Cookiebot.decline],
  ])('calls the %s reject API', (name, win, fn) => {
    expect(rejectViaCmpApi(win)).toBe(name);
    expect(fn(win)).toHaveBeenCalledOnce();
  });

  it('does not treat a bare __cmp (the generic TCF v1 API name other CMPs still shim) as Consentmanager', () => {
    const __cmp = vi.fn();
    expect(rejectViaCmpApi({ __cmp })).toBeNull();
    expect(__cmp).not.toHaveBeenCalled();
  });

  it('ignores a CMP object whose reject method is missing', () => {
    expect(rejectViaCmpApi({ OneTrust: {} })).toBeNull();
  });

  it('treats a throwing CMP API as not rejected, and tries the next CMP', () => {
    const decline = vi.fn();
    const win = {
      cmpmngr: {},
      __cmp: () => {
        throw new Error('boom');
      },
      Cookiebot: { decline },
    };
    expect(rejectViaCmpApi(win)).toBe('cookiebot');
    expect(decline).toHaveBeenCalledOnce();
  });

  it('survives a hostile getter', () => {
    const win = Object.defineProperty({}, '__cmp', {
      get() {
        throw new Error('Permission denied');
      },
    });
    expect(rejectViaCmpApi(win)).toBeNull();
  });
});

describe('startCmpRejectLoop', () => {
  afterEach(() => vi.useRealTimers());

  it('waits for the gate, rejects once, then stops', () => {
    vi.useFakeTimers();
    const __cmp = vi.fn();
    let enabled = false;
    const onRejected = vi.fn();
    startCmpRejectLoop({ getWindow: () => ({ __cmp, cmpmngr: {} }), isEnabled: () => enabled, onRejected });

    vi.advanceTimersByTime(1000);
    expect(__cmp).not.toHaveBeenCalled();

    enabled = true;
    vi.advanceTimersByTime(5000);
    expect(__cmp).toHaveBeenCalledOnce();
    expect(onRejected).toHaveBeenCalledOnce();
    expect(onRejected).toHaveBeenCalledWith('consentmanager');
  });

  it('picks up a CMP that loads late', () => {
    vi.useFakeTimers();
    const win: Record<string, unknown> = {};
    const onRejected = vi.fn();
    startCmpRejectLoop({ getWindow: () => win, isEnabled: () => true, onRejected });

    vi.advanceTimersByTime(3000);
    win.Didomi = { setUserDisagreeToAll: vi.fn() };
    vi.advanceTimersByTime(1000);
    expect(onRejected).toHaveBeenCalledWith('didomi');
  });

  it('gives up after the timeout when no CMP ever appears', () => {
    vi.useFakeTimers();
    const win: Record<string, unknown> = {};
    const onRejected = vi.fn();
    startCmpRejectLoop({ getWindow: () => win, isEnabled: () => true, onRejected });

    vi.advanceTimersByTime(20_000);
    win.__cmp = vi.fn();
    win.cmpmngr = {};
    vi.advanceTimersByTime(5000);
    expect(onRejected).not.toHaveBeenCalled();
    expect(win.__cmp).not.toHaveBeenCalled();
  });
});

describe('createTcfGate', () => {
  it('is ready immediately on pages without a TCF API', () => {
    const gate = createTcfGate(() => false, () => 0);
    expect(gate.isReady()).toBe(true);
  });

  it('holds the reject on TCF pages until the vendor count is captured', () => {
    const gate = createTcfGate(() => true, () => 0);
    expect(gate.isReady()).toBe(false);
    gate.markCaptured();
    expect(gate.isReady()).toBe(true);
  });

  it('gives up waiting after TCF_WAIT_MS, measured from when the TCF API appeared', () => {
    let now = 1000;
    let hasTcf = false;
    const gate = createTcfGate(() => hasTcf, () => now);
    expect(gate.isReady()).toBe(true); // no TCF yet
    hasTcf = true;
    expect(gate.isReady()).toBe(false); // clock starts now
    now += TCF_WAIT_MS - 1;
    expect(gate.isReady()).toBe(false);
    now += 1;
    expect(gate.isReady()).toBe(true);
  });
});

describe('startCmpRejectLoop with isReady', () => {
  afterEach(() => vi.useRealTimers());

  it('does not reject until isReady() is true', () => {
    vi.useFakeTimers();
    const __cmp = vi.fn();
    let ready = false;
    const onRejected = vi.fn();
    startCmpRejectLoop({ getWindow: () => ({ __cmp, cmpmngr: {} }), isEnabled: () => true, isReady: () => ready, onRejected });
    vi.advanceTimersByTime(3000);
    expect(__cmp).not.toHaveBeenCalled();
    ready = true;
    vi.advanceTimersByTime(1000);
    expect(onRejected).toHaveBeenCalledWith('consentmanager');
  });
});

describe('startCmpRejectLoop with shouldSkip', () => {
  afterEach(() => vi.useRealTimers());

  it('skips (never rejects) when shouldSkip is true, reporting once', () => {
    vi.useFakeTimers();
    const __cmp = vi.fn();
    const onRejected = vi.fn();
    const onSkipped = vi.fn();
    startCmpRejectLoop({
      getWindow: () => ({ __cmp, cmpmngr: {} }),
      isEnabled: () => true,
      shouldSkip: () => true,
      onRejected,
      onSkipped,
    });
    vi.advanceTimersByTime(5000);
    expect(__cmp).not.toHaveBeenCalled();
    expect(onRejected).not.toHaveBeenCalled();
    expect(onSkipped).toHaveBeenCalledOnce();
    expect(onSkipped).toHaveBeenCalledWith('consentmanager');
  });

  it('does not check shouldSkip until a CMP is present and ready', () => {
    vi.useFakeTimers();
    const shouldSkip = vi.fn(() => false);
    startCmpRejectLoop({ getWindow: () => ({}), isEnabled: () => true, shouldSkip, onRejected: vi.fn() });
    vi.advanceTimersByTime(2000);
    expect(shouldSkip).not.toHaveBeenCalled();
  });
});

describe('createBannerGate', () => {
  it('opens as soon as the banner is visible', () => {
    let shown = false;
    const gate = createBannerGate(() => shown, () => 0);
    expect(gate.isReady()).toBe(false);
    shown = true;
    expect(gate.isReady()).toBe(true);
  });

  it('opens after BANNER_WAIT_MS if no banner ever renders (e.g. returning visitor)', () => {
    let now = 500;
    const gate = createBannerGate(() => false, () => now);
    expect(gate.isReady()).toBe(false); // clock starts on first check
    now += BANNER_WAIT_MS;
    expect(gate.isReady()).toBe(true);
  });
});

describe('startCmpRejectLoop gate order', () => {
  afterEach(() => vi.useRealTimers());

  it('only consults isReady once a CMP is present (so wait clocks start then)', () => {
    vi.useFakeTimers();
    const isReady = vi.fn(() => true);
    const win: Record<string, unknown> = {};
    startCmpRejectLoop({ getWindow: () => win, isEnabled: () => true, isReady, onRejected: vi.fn() });
    vi.advanceTimersByTime(2000);
    expect(isReady).not.toHaveBeenCalled();
    win.__cmp = vi.fn();
    win.cmpmngr = {};
    vi.advanceTimersByTime(500);
    expect(isReady).toHaveBeenCalled();
  });
});
