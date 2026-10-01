import { el } from '../dom';
import { openOverlay, closeOverlay } from '../overlay';
import { companyRow, catBadge, siteFlagChip, type SiteFlagKind } from '../widgets';
import { SITE_FLAGS } from '../../../lib/dashboard/sites';
import { describeTracker } from '../../../lib/trackers/describe';
import { entityDetail, siteDetail, listActions } from '../../../lib/storage/db';

/** What each site flag means, in plain words. */
const FLAG_TEXT: Record<SiteFlagKind, string> = {
  violation: 'You clicked Reject, and this site kept tracking you anyway. See Violations for the evidence.',
  payOrOk: 'This site only lets you refuse tracking if you pay for a subscription, so Datawake left the choice to you.',
  fingerprint: 'A script here identified your device without cookies, so clearing cookies would not stop it.',
  rejected: 'Datawake said no to tracking on the cookie banner for you.',
};

export function openCompanyDetail(entity: string, category?: string): void {
  const d = describeTracker(entity, category);
  const wrap = el('div');

  wrap.append(el('h3', { class: 'sheet-title' }, entity));
  wrap.append(
    el(
      'div',
      { class: 'sheet-badges' },
      catBadge(category),
      el('span', { class: 'itag', style: `background:${d.impactColor}` }, `${d.impact} intrusiveness`),
    ),
  );

  wrap.append(el('p', { class: 'sheet-does' }, d.does));
  if (d.who) wrap.append(el('p', { class: 'muted' }, d.who));

  if (d.flow) {
    wrap.append(el('h4', {}, 'Where your data goes'));
    wrap.append(
      el(
        'div',
        { class: 'flowbox' },
        el('span', { class: 'flowbadge', style: `color:${d.flow.color};border-color:${d.flow.color}` }, d.flow.label),
        el('p', { class: 'flowrole' }, d.flow.role),
        el('p', {}, d.flow.text),
      ),
    );
  }

  // Show the sheet immediately; populate sites asynchronously
  const sitesPlaceholder = el('div');
  sitesPlaceholder.append(el('div', { class: 'skeleton', style: 'height:36px;border-radius:9px;margin-top:16px' }));
  wrap.append(sitesPlaceholder);
  openOverlay(wrap);

  void entityDetail(entity).then((detail) => {
    const heading = el('h4', {}, `Seen on ${detail.sites.length} site${detail.sites.length === 1 ? '' : 's'}`);
    const list = el('div', { class: 'list' });
    for (const s of detail.sites.slice(0, 60)) {
      const row = el('button', { class: 'siterow siterow-btn', type: 'button' });
      row.append(
        el('span', { class: 'sitename' }, s.site),
        el('span', { class: 'muted' }, `${s.count}× · last ${new Date(s.lastTs).toLocaleDateString()}`),
      );
      row.addEventListener('click', () => openSiteDetail(s.site));
      list.append(row);
    }
    sitesPlaceholder.replaceWith(heading, list);
  });
}

export function openSiteDetail(site: string): void {
  const wrap = el('div');
  wrap.append(el('h3', { class: 'sheet-title' }, site));

  const placeholder = el('div', { class: 'stack' });
  for (let i = 0; i < 4; i++)
    placeholder.append(el('div', { class: 'skeleton', style: 'height:46px;border-radius:9px' }));
  wrap.append(placeholder);
  openOverlay(wrap);

  void Promise.all([siteDetail(site), listActions()]).then(([companies, actions]) => {
    const seen = new Set(actions.filter((a) => a.site === site).map((a) => a.kind));
    const happened = el('div', { class: 'site-happened' });
    for (const f of SITE_FLAGS.filter((k) => seen.has(k))) {
      happened.append(el('div', { class: 'site-happened-row' }, siteFlagChip(f), el('p', {}, FLAG_TEXT[f])));
    }
    const known = companies.filter((c) => c.known);
    const summary = el('h4', {}, known.length === 0 ? 'No known trackers recorded here' : `${known.length} ${known.length === 1 ? 'company' : 'companies'} tracked you here`);
    const list = el('div', { class: 'list' });
    for (const c of companies) {
      list.append(companyRow(c, (entity, category) => openCompanyDetail(entity, category)));
    }
    placeholder.replaceWith(...(seen.size ? [happened] : []), summary, list);
  });
}

export { closeOverlay };
