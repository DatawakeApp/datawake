import { brandMark } from '../../lib/ui/brand-mark';
import {
  claimableFingerprints,
  fingerprintAlert,
  payOrOkAlert,
  rejectedAlert,
  sessionReplayAlert,
  vendorCountAlert,
  violationAlert,
} from './alerts';
import type { FpFinding } from '../../lib/fingerprint/findings';
import type { TabTrackers, EntityAggregate } from '../../lib/detection/tracker-store';
import { describeTracker } from '../../lib/trackers/describe';
import { companyLogoEl } from '../../lib/trackers/logos';
import { historyStats, type HistoryStats } from '../../lib/storage/db';
import { getSettings, toggleSitePause } from '../../lib/settings';
import { icon } from '../../lib/ui/icons';
import { siteScore } from '../../lib/scoring/score';
import { dataFlow } from '../../lib/brokers/flows';
import { categorizeCookies, summarizeCookies } from '../../lib/cookies/categorize';
import { splitCookiesBySite } from '../../lib/cookies/split';
import { registrableDomain } from '../../lib/util/domains';
import { fingerprintersAfterReject } from '../../lib/fingerprint/after-reject';
import { activeEntities, groupByPurpose, isActive, type Activity } from '../../lib/popup/live';

/** How often the open popup re-reads the tab, so new trackers appear while you watch. */
const LIVE_REFRESH_MS = 2_000;

const tabbar = document.getElementById('tabbar') as HTMLElement;
const panel = document.getElementById('panel') as HTMLElement;

// Brand header: icon + live dot + dashboard button
const h1 = document.querySelector('h1') as HTMLElement;
h1.prepend(brandMark(22));
const liveDot = document.createElement('span');
liveDot.className = 'live-dot';
liveDot.setAttribute('aria-label', 'monitoring active');
h1.append(liveDot);
const dashBtn = document.createElement('a');
dashBtn.id = 'report-link';
dashBtn.href = '#';
dashBtn.className = 'dash-btn';
dashBtn.textContent = 'Dashboard';
dashBtn.append(icon('external', 11, 'ic'));
dashBtn.addEventListener('click', (e) => {
  e.preventDefault();
  void browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html') });
});
const settingsBtn = document.createElement('a');
settingsBtn.href = '#';
settingsBtn.className = 'settings-btn';
settingsBtn.title = 'Settings';
settingsBtn.setAttribute('aria-label', 'Settings');
settingsBtn.append(icon('settings', 15));
settingsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  void browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html#settings') });
});
h1.append(dashBtn, settingsBtn);

type View = 'site' | 'web';
const TABS: { id: View; label: string }[] = [
  { id: 'site', label: 'This site' },
  { id: 'web', label: 'Across the web' },
];

let current: View = 'site';
let siteData: TabTrackers | undefined;
let web: HistoryStats | undefined;
const entitySites = new Map<string, number>();
let currentSite: string | null = null;
let sitePaused = false;
let rawCookies: Array<{ name: string; session: boolean; domain?: string }> = [];
let currentTabId: number | undefined;
let currentTabUrl: string | undefined;
let autoRejectEnabled = true;
let tcfVendorCount = 0;
let payOrOkWall = false;
let fingerprints: FpFinding[] = [];
let bannerRejected = false;
let activity: Activity = {};
/** Companies whose details the user opened, kept open across live refreshes. */
const openRows = new Set<string>();

async function init(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tab?.url;
  currentTabId = tab?.id;
  currentTabUrl = tabUrl;
  const [data, stats, settings, cookiesResult] = await Promise.all([
    tab?.id
      ? (browser.runtime.sendMessage({ type: 'GET_TAB_TRACKERS', tabId: tab.id }) as Promise<TabTrackers | undefined>)
      : Promise.resolve(undefined),
    historyStats(Number.MAX_SAFE_INTEGER),
    getSettings(),
    tabUrl && tabUrl.startsWith('http') && tab?.id
      ? (browser.runtime.sendMessage({ type: 'GET_COOKIES', url: tabUrl, tabId: tab.id }) as Promise<Array<{ name: string; session: boolean; domain?: string }>>)
      : Promise.resolve([]),
  ]);

  applyTabData(data);
  web = stats;
  // Fall back to the tab's own address if the background hasn't recorded the site yet.
  currentSite = data?.site ?? (tabUrl?.startsWith('http') ? registrableDomain(tabUrl) : null);
  sitePaused = currentSite ? (settings.pausedSites ?? []).includes(currentSite) : false;
  autoRejectEnabled = settings.autoRejectEnabled !== false;
  rawCookies = cookiesResult ?? [];

  for (const e of stats.entities) entitySites.set(e.entity, e.sites);
  renderSiteBar();
  renderTabs();
  show();
  startLiveRefresh(tab?.id);
}

function applyTabData(data: unknown): void {
  const d = data as (TabTrackers & Record<string, unknown>) | undefined;
  siteData = d;
  tcfVendorCount = (d?.tcfVendorCount as number | undefined) ?? 0;
  payOrOkWall = d?.payOrOkWall === true;
  fingerprints = Array.isArray(d?.fingerprints) ? (d!.fingerprints as FpFinding[]) : [];
  bannerRejected = d?.bannerRejected === true;
  activity = (d?.activity as Activity | undefined) ?? {};
}

/** What the "This site" view shows; a refresh only redraws when this changes. */
function siteSignature(): string {
  const now = Date.now();
  const ents = (siteData?.entities ?? []).map((e) => `${e.entity}:${e.domains.length}:${isActive(e.domains, activity, now) ? 1 : 0}`);
  return [ents.join(','), fingerprints.length, payOrOkWall, bannerRejected, tcfVendorCount, siteData?.violation?.newCookies?.length ?? 0].join('|');
}

function startLiveRefresh(tabId: number | undefined): void {
  if (tabId === undefined) return;
  let last = siteSignature();
  window.setInterval(async () => {
    try {
      applyTabData(await browser.runtime.sendMessage({ type: 'GET_TAB_TRACKERS', tabId }));
    } catch {
      return; // the background is restarting; try again next tick
    }
    const sig = siteSignature();
    if (sig === last || current !== 'site') return;
    last = sig;
    const y = document.scrollingElement?.scrollTop ?? 0;
    show();
    document.scrollingElement?.scrollTo(0, y);
  }, LIVE_REFRESH_MS);
}

function renderSiteBar(): void {
  document.getElementById('site-bar')?.remove();
  if (!currentSite) return;

  const bar = document.createElement('div');
  bar.id = 'site-bar';
  bar.className = 'site-bar';

  const domain = document.createElement('span');
  domain.className = 'site-domain';
  domain.textContent = currentSite;
  bar.append(domain);

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'pause-btn' + (sitePaused ? ' paused' : '');
  pauseBtn.type = 'button';
  pauseBtn.title = sitePaused ? 'Resume detection on this site' : 'Pause detection on this site';
  pauseBtn.textContent = sitePaused ? 'Paused' : 'Pause';
  pauseBtn.addEventListener('click', async () => {
    if (!currentSite) return;
    sitePaused = await toggleSitePause(currentSite);
    pauseBtn.textContent = sitePaused ? 'Paused' : 'Pause';
    pauseBtn.classList.toggle('paused', sitePaused);
    pauseBtn.title = sitePaused ? 'Resume detection on this site' : 'Pause detection on this site';
    if (current === 'site') show();
  });
  bar.append(pauseBtn);

  const header = document.querySelector('header') as HTMLElement;
  header.insertBefore(bar, document.getElementById('tabbar'));
}

function renderTabs(): void {
  tabbar.replaceChildren();
  for (const t of TABS) {
    const b = document.createElement('button');
    b.className = 'tab' + (t.id === current ? ' active' : '');
    b.textContent = t.label;
    b.addEventListener('click', () => {
      current = t.id;
      renderTabs();
      show();
    });
    tabbar.append(b);
  }
}

function show(): void {
  panel.replaceChildren();
  if (current === 'site') renderSite();
  else renderWeb();
}

function renderSite(): void {
  const site = siteData?.site ?? currentSite;
  if (sitePaused) panel.append(pausedNotice(site));
  if (!site) {
    panel.append(emptyState('shield', 'Nothing to check here', 'Open a website and Datawake will show who is tracking you there.'));
    return;
  }
  const entities = siteData?.entities ?? [];
  const known = entities.filter((e) => e.known);
  const services = entities.filter((e) => !e.known);
  // While paused nothing new is recorded, so don't show activity from before the pause as live.
  const now = sitePaused ? Number.MAX_SAFE_INTEGER : Date.now();

  if (known.length === 0) {
    panel.append(emptyState('shield', `No trackers on ${site}`, sitePaused
      ? 'Resume to let Datawake check this site again.'
      : 'Datawake is watching this page. Anything that loads later shows up here.'));
  } else {
    panel.append(liveHero(entities, site, now));
  }
  // Walls often hold trackers back until you choose, and fingerprinting can come from the site's
  // own code, so alerts can matter even with no known trackers.
  appendAlerts(known.filter((e) => e.category === 'Session replay').map((e) => e.entity), site);

  for (const g of groupByPurpose(known, activity, now)) {
    panel.append(sectionHead(g.title, String(g.entities.length)));
    const list = document.createElement('div');
    list.className = 'list';
    for (const e of g.entities) {
      const other = Math.max(0, (entitySites.get(e.entity) ?? 1) - 1);
      const reach = other > 0 ? `also on ${other} other site${other === 1 ? '' : 's'}` : 'only on this site';
      list.append(companyEntry(e.entity, e.category, reach, true, e.domains, isActive(e.domains, activity, now)));
    }
    panel.append(list);
  }
  if (services.length > 0) panel.append(otherServices(services));

  if (entities.length > 0) panel.append(cookieSummary(rawCookies));
}

/** Third parties that are not trackers (the site's own services, consent tools, content), folded away. */
function otherServices(services: EntityAggregate[]): HTMLElement {
  const box = document.createElement('details');
  box.className = 'services';
  const summary = document.createElement('summary');
  summary.append(
    Object.assign(document.createElement('span'), { className: 'section-title', textContent: `${services.length} other ${services.length === 1 ? 'service' : 'services'} on this page` }),
    Object.assign(document.createElement('span'), { className: 'section-note', textContent: 'not trackers' }),
  );
  const list = document.createElement('div');
  list.className = 'list';
  for (const e of services) list.append(companyEntry(e.entity, e.category, 'the site, a consent tool or content', false, e.domains));
  box.append(summary, list);
  return box;
}

function pausedNotice(site: string | null): HTMLElement {
  const p = document.createElement('p');
  p.className = 'paused-note';
  p.textContent = `Paused on ${site ?? 'this site'}. Datawake is not checking or rejecting here until you resume.`;
  return p;
}

/** All alerts as one compact list, most important first. */
function appendAlerts(replayers: string[], site: string | null = siteData?.site ?? null): void {
  const rows: HTMLElement[] = [];
  const cookieViolation = siteData?.violation?.newCookies?.length ? siteData.violation : null;
  if (cookieViolation) rows.push(violationAlert(cookieViolation, site, fingerprintersAfterReject(fingerprints)));
  if (fingerprints.length > 0) {
    rows.push(fingerprintAlert(fingerprints, cookieViolation ? undefined : { site: site ?? 'this site', timestamp: Date.now() }));
  }
  if (replayers.length > 0) rows.push(sessionReplayAlert(replayers));
  if (payOrOkWall) rows.push(payOrOkAlert(autoRejectEnabled));
  if (bannerRejected) rows.push(rejectedAlert());
  if (tcfVendorCount > 0) rows.push(vendorCountAlert(tcfVendorCount));
  if (rows.length === 0) return;
  const box = document.createElement('div');
  box.className = 'alerts';
  box.append(...rows);
  panel.append(box);
}

function renderWeb(): void {
  if (!web || web.totalEvents === 0) {
    panel.append(emptyState('brand', 'Nothing tracked yet', 'Browse a few sites and come back.'));
    return;
  }
  const known = web.entities.filter((e) => e.known);
  panel.append(
    sectionHead(`Companies across ${web.siteCount} site${web.siteCount === 1 ? '' : 's'}`, String(known.length), 'Last 90 days'),
  );
  // Count companies per category (web.categories counts events, which wouldn't add up to the heading).
  panel.append(categorySummary(countCategories(known.map((e) => e.category))));

  // Stalker section, sorted by site breadth
  const stalkers = web.entities
    .filter((e) => e.known && e.sites >= 2)
    .sort((a, b) => b.sites - a.sites)
    .slice(0, 6);

  if (stalkers.length > 0) {
    const section = document.createElement('div');
    section.className = 'stalker-section';
    const heading = document.createElement('p');
    heading.className = 'stalker-heading';
    heading.textContent = 'Follows you across sites';
    section.append(heading);
    for (const s of stalkers) {
      const row = document.createElement('div');
      row.className = 'stalker-row';
      const label = document.createElement('span');
      label.className = 'stalker-name';
      label.textContent = s.entity;
      const pct = Math.min(100, Math.round((s.sites / web.siteCount) * 100));
      const bar = document.createElement('div');
      bar.className = 'stalker-bar-wrap';
      bar.setAttribute('role', 'meter');
      bar.setAttribute('aria-label', `${s.entity} seen on ${pct}% of your sites`);
      bar.setAttribute('aria-valuenow', String(pct));
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      const fill = document.createElement('div');
      fill.className = 'stalker-bar-fill';
      fill.style.width = `${pct}%`;
      bar.append(fill);
      const count = document.createElement('span');
      count.className = 'stalker-count';
      count.textContent = `${s.sites} site${s.sites === 1 ? '' : 's'}`;
      row.append(label, bar, count);
      section.append(row);
    }
    panel.append(section);
  }

  const list = document.createElement('div');
  list.className = 'list';
  for (const e of known.slice(0, 20)) {
    list.append(companyEntry(e.entity, e.category, `on ${e.sites} site${e.sites === 1 ? '' : 's'}`, true));
  }
  panel.append(list);
}

// ── components ──────────────────────────────────────────────────────────────

/** Top of "This site": the grade, how many companies track you here, and how many are active now. */
function liveHero(entities: EntityAggregate[], site: string | null, now: number): HTMLElement {
  const known = entities.filter((e) => e.known);
  const s = siteScore(entities, { fingerprintingDomains: claimableFingerprints(fingerprints).length });
  const hero = document.createElement('div');
  hero.className = 'hero';
  hero.setAttribute('role', 'status');

  // Pay-or-OK walls hold trackers back until you choose, so a grade would read as an all-clear.
  const graded = !payOrOkWall;
  const grade = document.createElement('span');
  grade.className = 'score-grade' + (graded ? '' : ' ungraded');
  grade.style.setProperty('--grade', graded ? s.color : 'var(--muted)');
  grade.textContent = graded ? s.grade : '?';
  grade.title = graded ? `Privacy grade ${s.grade}: ${s.label}` : 'Not graded until you choose';

  const meta = document.createElement('span');
  meta.className = 'score-meta';
  const headline = document.createElement('span');
  headline.className = 'hero-headline';
  headline.textContent = known.length === 0
    ? `No known trackers on ${site ?? 'this page'}`
    : `${known.length} ${known.length === 1 ? 'company is' : 'companies are'} tracking you here`;
  const sub = document.createElement('span');
  sub.className = 'score-sub';
  sub.textContent = graded ? `${s.label} · ${scoreReason(entities)}` : 'Not graded: this site holds trackers back until you choose';
  meta.append(headline, sub);
  hero.append(grade, meta);

  const active = activeEntities(entities, activity, now);
  const live = document.createElement('p');
  live.hidden = sitePaused;
  live.className = 'hero-live' + (active.length ? ' on' : '');
  live.append(Object.assign(document.createElement('span'), { className: 'pulse' }));
  live.append(active.length === 0
    ? 'None sending data right now'
    : active.length === known.length
      ? `${active.length === 1 ? 'It is' : 'All of them are'} sending data right now`
      : `${active.length} of ${known.length} sending data right now`);
  const box = document.createElement('div');
  box.className = 'hero-wrap';
  box.append(hero, live);
  return box;
}

function scoreReason(entities: EntityAggregate[]): string {
  const known = entities.filter((e) => e.known);
  const claimable = claimableFingerprints(fingerprints).length;
  const fp = claimable > 0 ? `${claimable} fingerprinting script${claimable > 1 ? 's' : ''}` : null;
  if (known.length === 0) return fp ?? 'No trackers detected on this page';

  const sellers = known.filter((e) => dataFlow(e.entity)?.sharing === 'sells');
  const replayers = known.filter((e) => e.category === 'Session replay');
  const adTrackers = known.filter((e) => e.category === 'Advertising');

  const parts: string[] = fp ? [fp] : [];
  if (replayers.length > 0) parts.push(`${replayers.length} screen recorder${replayers.length > 1 ? 's' : ''}`);
  if (sellers.length > 0) parts.push(`${sellers.length} ${sellers.length === 1 ? 'company sells' : 'companies sell'} your data`);
  if (adTrackers.length > 0 && parts.length < 2) parts.push(`${adTrackers.length} ad tracker${adTrackers.length > 1 ? 's' : ''}`);

  if (parts.length > 0) return parts.join(' · ');
  return `${known.length} tracker${known.length === 1 ? '' : 's'}, none high risk`;
}

function cookieSummary(cookies: Array<{ name: string; session: boolean; domain?: string }>): HTMLElement {
  const card = document.createElement('div');
  card.className = 'ck-card';

  // ── header row: title + refresh ──
  const hdr = document.createElement('div');
  hdr.className = 'ck-hdr';

  const titleEl = document.createElement('span');
  titleEl.className = 'ck-title';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'ck-refresh';
  refreshBtn.type = 'button';
  refreshBtn.title = 'Re-scan cookies';
  refreshBtn.append(icon('refresh-cw', 12));
  refreshBtn.addEventListener('click', async () => {
    if (!currentTabUrl || !currentTabId) return;
    refreshBtn.classList.add('spinning');
    try {
      const result = await (browser.runtime.sendMessage({
        type: 'GET_COOKIES',
        url: currentTabUrl,
        tabId: currentTabId,
      }) as Promise<Array<{ name: string; session: boolean; domain?: string }>>);
      rawCookies = result ?? [];
    } finally {
      refreshBtn.classList.remove('spinning');
    }
    card.replaceWith(cookieSummary(rawCookies));
  });

  hdr.append(titleEl, refreshBtn);
  card.append(hdr);

  // ── empty state ──
  if (!cookies || cookies.length === 0) {
    titleEl.textContent = 'No tracking cookies';
    const sub = document.createElement('p');
    sub.className = 'ck-empty';
    sub.textContent = bannerRejected
      ? 'Datawake rejected the cookie banner, so no tracking cookies were set.'
      : 'No tracking cookies yet. Tap refresh if you accept a cookie banner.';
    card.append(sub);
    return card;
  }

  const categorized = categorizeCookies(cookies);
  const counts = summarizeCookies(categorized);

  // Tracker cookies are shared by every site that loads those trackers, so split them out:
  // otherwise "175 cookies" reads as if this one site set them all.
  titleEl.textContent = 'Cookies';
  const { own, trackers } = splitCookiesBySite(cookies, currentSite);
  card.append(cookieRow('This site', own));
  if (trackers.length > 0) {
    card.append(cookieRow('Trackers on this page', trackers));
    const note = document.createElement('p');
    note.className = 'ck-note';
    note.textContent = 'Trackers share their cookies across every site you visit, so this includes cookies set on other sites.';
    card.append(note);
  }

  // ── pill row ──
  const pills = document.createElement('div');
  pills.className = 'ck-legend';

  const CAT_COLOR: Record<string, string> = {
    tracking: '#e5484d',
    session: '#6e9eff',
    functional: '#3fb68b',
    other: '#6b7686',
  };
  const CAT_LABEL: Record<string, string> = {
    tracking: 'tracking',
    session: 'login',
    functional: 'preferences',
    other: 'unknown',
  };

  for (const cat of ['tracking', 'session', 'functional', 'other'] as const) {
    const n = counts[cat];
    if (n === 0) continue;
    const color = CAT_COLOR[cat];
    const pill = document.createElement('span');
    pill.className = 'ck-item';
    pill.style.setProperty('--pill', color);
    const dot = document.createElement('span');
    dot.className = 'ck-dot';
    pill.append(dot, `${n} ${CAT_LABEL[cat]}`);
    pills.append(pill);
  }

  card.append(pills);
  return card;
}

/** One line of the cookie card: "This site   22 cookies · 3 for tracking". */
function cookieRow(label: string, cookies: Array<{ name: string; session: boolean; domain?: string }>): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ck-row';
  const name = document.createElement('span');
  name.className = 'ck-row-label';
  name.textContent = label;
  const value = document.createElement('span');
  value.className = 'ck-row-value';
  value.textContent = cookies.length === 1 ? '1 cookie' : `${cookies.length} cookies`;
  const tracking = summarizeCookies(categorizeCookies(cookies)).tracking;
  if (tracking > 0) {
    const warn = document.createElement('span');
    warn.className = 'ck-warn';
    warn.textContent = ` · ${tracking} for tracking`;
    value.append(warn);
  }
  row.append(name, value);
  return row;
}

/** Quiet section heading: "Companies tracking you            9". */
function sectionHead(title: string, count = '', note = ''): HTMLElement {
  const h = document.createElement('div');
  h.className = 'section-head';
  const t = document.createElement('span');
  t.className = 'section-title';
  t.textContent = title;
  h.append(t);
  if (note) {
    const n = document.createElement('span');
    n.className = 'section-note';
    n.textContent = note;
    h.append(n);
  }
  if (count) {
    const c = document.createElement('span');
    c.className = 'section-count';
    c.textContent = count;
    h.append(c);
  }
  return h;
}

function countCategories(categories: Array<string | undefined>): [string, number][] {
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c || 'Other', (counts.get(c || 'Other') ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Plain line instead of coloured pills: "4 advertising · 1 analytics · 4 other". */
function categorySummary(pairs: [string, number][]): HTMLElement {
  const p = document.createElement('p');
  p.className = 'cat-summary';
  p.textContent = pairs.map(([c, n]) => `${n} ${c.toLowerCase()}`).join(' · ');
  return p;
}

function emptyState(iconName: string, title: string, sub: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'empty';
  box.append(iconName === 'brand' ? brandMark(30, 'empty-ic') : icon(iconName, 30, 'empty-ic'));
  const t = document.createElement('p');
  t.className = 'empty-title';
  t.textContent = title;
  const s = document.createElement('p');
  s.className = 'empty-sub';
  s.textContent = sub;
  box.append(t, s);
  return box;
}

function companyEntry(
  entity: string,
  category: string | undefined,
  reachText: string,
  known: boolean,
  domains: string[] = [],
  active = false,
): HTMLElement {
  const d = describeTracker(entity, category);

  const row = document.createElement('div');
  row.className = 'row' + (known ? '' : ' unknown');

  const head = document.createElement('button');
  head.className = 'row-head';
  head.type = 'button';
  head.setAttribute('aria-expanded', 'false');

  const text = document.createElement('span');
  text.className = 'row-text';
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = entity;
  const sub = document.createElement('span');
  sub.className = 'row-sub';
  sub.textContent = reachText;
  if (active) {
    const now = document.createElement('span');
    now.className = 'active-now';
    now.textContent = 'Active now';
    sub.prepend(now, ' · ');
  }
  text.append(name, sub);
  head.append(companyLogoEl(entity, d.color), text);

  if (known) {
    const risk = document.createElement('span');
    risk.className = 'risk';
    risk.style.setProperty('--risk', d.impactColor);
    risk.title = `${d.impact} risk`;
    risk.append(Object.assign(document.createElement('span'), { className: 'risk-dot' }), d.impact.charAt(0).toUpperCase() + d.impact.slice(1));
    head.append(risk);
  }
  head.append(icon('chevron-down', 14, 'chev'));
  row.append(head);

  const detail = document.createElement('div');
  detail.className = 'detail';
  detail.hidden = true;
  if (d.does) detail.append(para('does', d.does));
  if (d.who) detail.append(para('who', d.who));
  if (d.flow) {
    const fl = document.createElement('div');
    fl.className = 'flowmini';
    const tag = document.createElement('span');
    tag.className = 'flowtag';
    tag.style.setProperty('--flow', d.flow.color);
    tag.textContent = d.flow.label;
    fl.append(tag, para('frole', d.flow.role));
    detail.append(fl, para('means', d.flow.text));
  }
  if (domains.length) detail.append(para('domains', domains.slice(0, 8).join(', ')));

  if (detail.childElementCount > 0) {
    const setOpen = (open: boolean): void => {
      detail.hidden = !open;
      head.setAttribute('aria-expanded', String(open));
      row.classList.toggle('open', open);
      if (open) openRows.add(entity);
      else openRows.delete(entity);
    };
    head.addEventListener('click', () => setOpen(detail.hidden));
    if (openRows.has(entity)) setOpen(true);
    row.append(detail);
  } else {
    head.classList.add('no-toggle');
  }
  return row;
}

function para(cls: string, text: string): HTMLElement {
  const el = document.createElement('p');
  el.className = cls;
  el.textContent = text;
  return el;
}


// ── footer ──────────────────────────────────────────────────────────────────

const zeroEl = document.querySelector('.zero');
if (zeroEl) {
  zeroEl.innerHTML = '';
  const dot = document.createElement('span');
  dot.className = 'zero-dot';
  zeroEl.append(dot, document.createTextNode('Local only. Nothing leaves your device.'));
}

init().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[Datawake] init failed:', msg);
  panel.replaceChildren(emptyState('shield', 'Could not read this tab.', 'Try reloading the page. If this persists, check the extension is enabled.'));
});
