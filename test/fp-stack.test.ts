import { describe, it, expect } from 'vitest';
import { callerScript } from '../lib/fingerprint/stack';

const ours = 'chrome-extension://abcdefghijklmnop/content-scripts/fp-probe.js';

describe('callerScript', () => {
  it('skips our own wrapper frames and returns the first page script', () => {
    const stack = `Error
    at Object.apply (${ours}:1:2345)
    at HTMLCanvasElement.toDataURL (${ours}:1:999)
    at getCanvasFp (https://cdn.fpjs.example/v3/agent.js?token=secret#x:12:345)
    at https://www.shop.example/app.js:1:10`;
    expect(callerScript(stack)).toBe('https://cdn.fpjs.example/v3/agent.js');
  });

  it('handles anonymous frames without a function name', () => {
    expect(callerScript(`Error\n    at ${ours}:1:2\n    at https://t.example/a.js:3:4`)).toBe('https://t.example/a.js');
  });

  it('attributes eval’d code to the script that called eval', () => {
    const stack = `Error
    at Object.apply (${ours}:1:2)
    at eval (eval at load (https://t.example/loader.js:5:6), <anonymous>:1:1)`;
    expect(callerScript(stack)).toBe('https://t.example/loader.js');
  });

  it('returns the page URL for inline scripts', () => {
    expect(callerScript(`Error\n    at ${ours}:1:2\n    at https://news.example/article?id=3:120:5`)).toBe(
      'https://news.example/article',
    );
  });

  it('ignores moz-extension frames too, and returns null when no page frame exists', () => {
    expect(callerScript(`Error\n    at moz-extension://x/a.js:1:2`)).toBeNull();
    expect(callerScript('')).toBeNull();
    expect(callerScript(undefined)).toBeNull();
  });
});
