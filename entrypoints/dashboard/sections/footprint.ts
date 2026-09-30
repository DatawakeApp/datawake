import { el, toast } from '../dom';
import { companyRow } from '../widgets';
import { openCompanyDetail } from './detail';
import {
  historyStats,
  listAccounts,
  addAccount,
  removeAccount,
  type EntityStat,
  type AccountEntry,
} from '../../../lib/storage/db';

export async function renderFootprint(root: HTMLElement): Promise<void> {
  root.replaceChildren(footprintSkeleton());

  const draw = async (): Promise<void> => {
    root.replaceChildren(footprintSkeleton());
    const [stats, accounts] = await Promise.all([historyStats(Number.MAX_SAFE_INTEGER), listAccounts()]);
    root.replaceChildren(view(stats.entities.filter((e) => e.known), accounts));
  };

  function view(entities: EntityStat[], accounts: AccountEntry[]): HTMLElement {
    const wrap = el('div');
    const total = new Set([...entities.map((e) => e.entity), ...accounts.map((a) => a.company)]).size;

    wrap.append(
      el(
        'div',
        { class: 'hero' },
        el('span', { class: 'hero-num' }, String(total)),
        el('span', { class: 'hero-lbl' }, total === 1 ? 'company has tracked you so far' : 'companies have tracked you so far'),
      ),
    );
    wrap.append(
      el(
        'p',
        { class: 'muted intro' },
        'Reconstructed locally from trackers seen while you browse, plus accounts you add below. Treat it as a floor, not a complete list.',
      ),
    );

    wrap.append(el('h2', {}, 'Accounts you have'));
    wrap.append(accountForm());
    if (accounts.length) {
      const al = el('div', { class: 'list' });
      for (const a of accounts) al.append(accountRow(a));
      wrap.append(al);
    } else {
      wrap.append(
        el('p', { class: 'muted' }, 'Add companies you have accounts with (banks, shops, apps) to round out your footprint.'),
      );
    }

    wrap.append(el('h2', {}, 'Seen tracking you across the web'));
    if (!entities.length) {
      wrap.append(el('p', { class: 'muted' }, 'Nothing detected yet. Browse a little and come back.'));
      return wrap;
    }

    const search = el('input', { type: 'search', class: 'search', placeholder: 'Search companies…' }) as HTMLInputElement;
    wrap.append(search);
    const list = el('div', { class: 'list' });
    const rows: { entity: string; node: HTMLElement }[] = [];
    for (const e of entities) {
      const node = companyRow(e, openCompanyDetail);
      rows.push({ entity: e.entity.toLowerCase(), node });
      list.append(node);
    }
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      for (const r of rows) r.node.hidden = q.length > 0 && !r.entity.includes(q);
    });
    wrap.append(list);

    return wrap;
  }

  function accountForm(): HTMLElement {
    const form = el('form', { class: 'addform' });
    const name = el('input', { type: 'text', placeholder: 'Company (e.g. Spotify)', required: 'required' }) as HTMLInputElement;
    const domain = el('input', { type: 'text', placeholder: 'domain (optional)' }) as HTMLInputElement;
    form.append(name, domain, el('button', { class: 'btn', type: 'submit', textContent: 'Add' }));
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const company = name.value.trim();
      if (!company) { name.focus(); return; }
      void addAccount({ company, domain: domain.value.trim() || undefined, source: 'manual', addedAt: Date.now() }).then(() => {
        name.value = '';
        domain.value = '';
        toast(`Added ${company}`);
        void draw();
      });
    });
    return form;
  }

  function accountRow(a: AccountEntry): HTMLElement {
    const row = el('div', { class: 'siterow' });
    row.append(el('span', { class: 'sitename' }, a.company + (a.domain ? ` · ${a.domain}` : '')));

    const actions = el('div', { class: 'reqactions' });
    const rm = el('button', { class: 'btn secondary small', type: 'button', textContent: 'Remove' });
    rm.addEventListener('click', () => {
      if (a.id != null) void removeAccount(a.id).then(draw);
    });
    actions.append(rm);
    row.append(actions);
    return row;
  }

  await draw();
}

function footprintSkeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  box.append(el('div', { class: 'hero skeleton', style: 'height:88px' }));
  const list = el('div', { class: 'list', style: 'margin-top:16px' });
  for (let i = 0; i < 6; i++) list.append(el('div', { class: 'skeleton', style: 'height:48px;border-radius:9px' }));
  box.append(list);
  return box;
}
