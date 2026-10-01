/** Accounts you have: companies you hold accounts with, to round out what is known about you. */
import { el, toast } from '../dom';
import { widget } from '../widgets';
import { listAccounts, addAccount, removeAccount, type AccountEntry } from '../../../lib/storage/db';

export function accountsWidget(): HTMLElement {
  const body = el('div', { class: 'stack' });
  const box = widget('Accounts you have', body);

  const draw = async (): Promise<void> => {
    const accounts = await listAccounts();
    const list = el('div', { class: 'list' });
    for (const a of accounts) list.append(accountRow(a, draw));
    body.replaceChildren(
      el('p', { class: 'muted' }, 'Banks, shops and apps you have accounts with also hold data on you. Add them to keep track, and to send them requests under Take action.'),
      accountForm(draw),
      ...(accounts.length ? [list] : []),
    );
  };
  void draw().catch(() => toast('Could not load your accounts', 'err'));
  return box;
}

function accountForm(onChange: () => Promise<void>): HTMLElement {
  const form = el('form', { class: 'addform' });
  const name = el('input', { type: 'text', placeholder: 'Company (e.g. Spotify)', required: 'required', 'aria-label': 'Company' }) as HTMLInputElement;
  const domain = el('input', { type: 'text', placeholder: 'Website (optional)', 'aria-label': 'Website' }) as HTMLInputElement;
  form.append(name, domain, el('button', { class: 'btn', type: 'submit', textContent: 'Add' }));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const company = name.value.trim();
    if (!company) { name.focus(); return; }
    void addAccount({ company, domain: domain.value.trim() || undefined, source: 'manual', addedAt: Date.now() })
      .then(() => { name.value = ''; domain.value = ''; toast(`Added ${company}`); return onChange(); })
      .catch(() => toast('Could not add the account', 'err'));
  });
  return form;
}

function accountRow(a: AccountEntry, onChange: () => Promise<void>): HTMLElement {
  const rm = el('button', { class: 'btn secondary small', type: 'button', textContent: 'Remove' });
  rm.addEventListener('click', () => {
    if (a.id != null) void removeAccount(a.id).then(onChange).catch(() => toast('Could not remove it', 'err'));
  });
  return el('div', { class: 'siterow' }, el('span', { class: 'sitename' }, a.company + (a.domain ? ` · ${a.domain}` : '')), rm);
}
