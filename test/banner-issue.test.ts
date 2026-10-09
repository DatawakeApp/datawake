import { describe, it, expect } from 'vitest';
import { bannerIssueUrl } from '../lib/report/banner-issue';

describe('bannerIssueUrl', () => {
  it('opens a pre-filled GitHub issue naming only the site', () => {
    const url = new URL(bannerIssueUrl('example-news.com', '1.0.0'));
    expect(url.origin + url.pathname).toBe('https://github.com/DatawakeApp/datawake/issues/new');
    expect(url.searchParams.get('title')).toBe('Banner not rejected: example-news.com');
    const body = url.searchParams.get('body')!;
    expect(body).toContain('example-news.com');
    expect(body).toContain('1.0.0');
    expect(body).not.toMatch(/https?:\/\/[^\s]*example-news/); // the site, never the page address
  });
});
