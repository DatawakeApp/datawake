/** "Couldn't reject this banner": a pre-filled GitHub issue that names only the site, never the page. */
const ISSUES = 'https://github.com/DatawakeApp/datawake/issues/new';

export function bannerIssueUrl(site: string, version: string): string {
  const body = [
    `Datawake found a cookie banner on **${site}** but could not reject it.`,
    '',
    `Extension version: ${version}`,
    '',
    'Anything else that helps (optional): what the banner looked like, the button names, your country.',
  ].join('\n');
  const url = new URL(ISSUES);
  url.searchParams.set('title', `Banner not rejected: ${site}`);
  url.searchParams.set('body', body);
  return url.toString();
}
