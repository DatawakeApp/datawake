import { el } from '../dom';
import { openOverlay, closeOverlay } from '../overlay';
import { companyRow, catBadge } from '../widgets';
import { describeTracker } from '../../../lib/trackers/describe';
import { entityDetail, siteDetail } from '../../../lib/storage/db';

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

  void siteDetail(site).then((companies) => {
    const known = companies.filter((c) => c.known);
    const summary = el('p', { class: 'muted' }, `${known.length} compan${known.length === 1 ? 'y' : 'ies'} tracked you on this site.`);
    const list = el('div', { class: 'list' });
    for (const c of companies) {
      list.append(companyRow(c, (entity, category) => openCompanyDetail(entity, category)));
    }
    placeholder.replaceWith(summary, list);
  });
}

export { closeOverlay };
