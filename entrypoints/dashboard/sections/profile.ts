import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { adProfileStats } from '../../../lib/storage/db';
import type { CategoryProfile } from '../../../lib/trackers/site-categories';
import { accountsWidget } from './accounts';

export async function renderProfile(root: HTMLElement): Promise<void> {
  root.replaceChildren(skeleton());
  const cats = await adProfileStats();

  if (cats.length === 0) {
    root.replaceChildren(
      el('div', { class: 'empty' },
        icon('ads', 36, 'empty-ic'),
        el('p', { class: 'empty-title' }, 'No ad profile yet'),
        el('p', { class: 'muted' }, 'Browse news, shopping or health sites, and Datawake will show which audience groups ad networks have put you in.'),
      ),
      accountsWidget(),
    );
    return;
  }

  const totalHits = cats.reduce((s, c) => s + c.trackerHits, 0);

  const wrap = el('div', { class: 'stack' });

  // ── Persona narrative ───────────────────────────────────────────────────────
  const top3 = cats.slice(0, 3).map((c) => c.category);
  const persona = el('div', { class: 'profile-persona' });

  const disclaimer = el('p', { style: 'font-size:12.5px;color:var(--muted);margin:0 0 14px;line-height:1.55;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)' });
  disclaimer.textContent = 'This is a local reconstruction based on which trackers you encounter. It is not your actual profile from Google, Facebook, or any other platform. Those profiles are proprietary and can only be seen through each company\'s own tools, linked under Take action.';
  persona.append(disclaimer);

  const statement = el('p', { class: 'profile-statement' });
  statement.append('Based on your tracker activity, you are likely categorised as a ');
  top3.forEach((cat, i) => {
    const tag = el('span', { class: 'profile-persona-tag', style: `color:${cats[i].color};border-color:${cats[i].color}30` }, cat);
    statement.append(tag);
    if (i < top3.length - 2) statement.append(', ');
    else if (i === top3.length - 2) statement.append(' and ');
  });
  if (cats.length > 3) statement.append(` audience, and ${cats.length - 3} more.`);
  else statement.append(' audience.');
  persona.append(statement);

  const statsRow = el('div', { class: 'profile-stats-row' });
  statsRow.append(
    statPill(`${cats.length}`, 'categories'),
    statPill(totalHits.toLocaleString(), 'tracker observations'),
    statPill(cats.reduce((s, c) => s + c.siteCount, 0).toString(), 'sites with a known topic'),
  );
  persona.append(statsRow);

  // Proportional segment bar
  const segBar = el('div', { class: 'profile-seg-bar', 'aria-hidden': 'true' });
  for (const c of cats) {
    const pct = totalHits > 0 ? (c.trackerHits / totalHits) * 100 : 0;
    const seg = el('div', {
      class: 'profile-seg',
      style: `width:${pct.toFixed(2)}%;background:${c.color};opacity:0.85`,
      title: `${c.category}: ${Math.round(pct)}%`,
    });
    segBar.append(seg);
  }
  persona.append(segBar);

  const segLegend = el('div', { class: 'profile-seg-legend' });
  for (const c of cats.slice(0, 5)) {
    const pct = totalHits > 0 ? Math.round((c.trackerHits / totalHits) * 100) : 0;
    const item = el('div', { class: 'profile-seg-legend-item' });
    item.append(
      el('span', { class: 'profile-seg-dot', style: `background:${c.color}` }),
      el('span', { class: 'profile-seg-name' }, c.category),
      el('span', { class: 'profile-seg-pct' }, `${pct}%`),
    );
    segLegend.append(item);
  }
  if (cats.length > 5) {
    segLegend.append(el('span', { style: 'font-size:12px;color:var(--muted);align-self:center' }, `+${cats.length - 5} more`));
  }
  persona.append(segLegend);

  wrap.append(persona);

  // ── Ranked category list ───────────────────────────────────────────────────
  const listWrap = el('div', { class: 'widget' });
  listWrap.append(el('div', { class: 'widget-h' }, 'Your audience categories, ranked by exposure'));

  const list = el('div', { class: 'profile-list' });
  for (const cat of cats) {
    list.append(categoryRow(cat, totalHits));
  }
  listWrap.append(list);
  wrap.append(listWrap);

  wrap.append(accountsWidget());

  wrap.append(
    el('p', { class: 'profile-note' },
      'Your browsing data never left this browser. This reconstruction uses the same signals ad networks collect, so it gives you a realistic sense of how you are categorised.',
    ),
  );

  root.replaceChildren(wrap);
}

function statPill(value: string, label: string): HTMLElement {
  const pill = el('div', { class: 'profile-stat-pill' });
  pill.append(
    el('span', { class: 'profile-stat-num' }, value),
    el('span', { class: 'profile-stat-lbl' }, label),
  );
  return pill;
}

function categoryRow(cat: CategoryProfile, totalHits: number): HTMLElement {
  const pct = totalHits > 0 ? (cat.trackerHits / totalHits) * 100 : 0;
  const shareLabel = `${Math.round(pct)}%`;

  const row = el('div', { class: 'profile-cat-row' });

  // Head (always visible, clickable)
  const head = el('button', { class: 'profile-cat-head', type: 'button', 'aria-expanded': 'false' });

  const left = el('div', { class: 'profile-cat-left' });
  left.append(el('span', { class: 'profile-cat-dot', style: `background:${cat.color}` }));
  left.append(el('span', { class: 'profile-cat-name' }, cat.category));
  head.append(left);

  const center = el('div', { class: 'profile-cat-center' });
  const barWrap = el('div', { class: 'profile-cat-bar-wrap' });
  const barFill = el('div', { class: 'profile-cat-bar-fill', style: `width:${pct.toFixed(2)}%;background:${cat.color}` });
  barWrap.append(barFill);
  center.append(barWrap);
  head.append(center);

  const right = el('div', { class: 'profile-cat-right' });
  right.append(
    el('span', { class: 'profile-cat-hits' }, cat.trackerHits.toLocaleString()),
    el('span', { class: 'profile-cat-share' }, shareLabel),
  );
  right.append(icon('chevron-down', 14, 'profile-cat-chev'));
  head.append(right);

  row.append(head);

  // Body (expandable)
  const body = el('div', { class: 'profile-cat-body' });
  body.hidden = true;

  if (cat.topCompanies.length > 0) {
    const coRow = el('div', { class: 'profile-cat-detail-row' });
    coRow.append(el('span', { class: 'profile-cat-detail-label' }, 'Tracked by'));
    const tags = el('div', { class: 'profile-cat-tags' });
    for (const co of cat.topCompanies) {
      tags.append(el('span', { class: 'profile-cat-tag', style: `border-color:${cat.color}30;color:${cat.color}` }, co));
    }
    coRow.append(tags);
    body.append(coRow);
  }

  const siteRow = el('div', { class: 'profile-cat-detail-row' });
  siteRow.append(el('span', { class: 'profile-cat-detail-label' }, 'Activity'));
  siteRow.append(
    el('span', { class: 'profile-cat-detail-text' },
      `${cat.siteCount} site${cat.siteCount === 1 ? '' : 's'} · ${cat.trackerHits.toLocaleString()} observations (${shareLabel} of total)`,
    ),
  );
  body.append(siteRow);

  row.append(body);

  head.addEventListener('click', () => {
    const open = body.hidden;
    body.hidden = !open;
    head.setAttribute('aria-expanded', String(open));
    row.classList.toggle('open', open);
  });

  return row;
}

function skeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  box.append(el('div', { class: 'skeleton', style: 'height:120px;border-radius:16px' }));
  const list = el('div', { class: 'widget skeleton tall' });
  box.append(list);
  return box;
}
