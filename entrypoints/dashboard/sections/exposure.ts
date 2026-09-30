import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { historyStats, adProfileStats } from '../../../lib/storage/db';
import { dataFlow } from '../../../lib/brokers/flows';
import { widget } from '../widgets';
import { openCompanyDetail } from './detail';
import { loadKey, saveKey, checkBreaches, type Breach } from '../../../lib/breach/hibp';

const DAY = 86_400_000;

export async function renderExposure(root: HTMLElement): Promise<void> {
  root.replaceChildren(skeleton());

  const [stats, catProfiles] = await Promise.all([historyStats(90 * DAY), adProfileStats()]);
  const known = stats.entities.filter((e) => e.known);
  const brokers = known.filter((e) => dataFlow(e.entity)?.sharing === 'sells');

  const wrap = el('div', { class: 'stack' });

  // ── Summary: what we saw, stated plainly (we see brokers' trackers, not their files on you) ──
  const hero = el('section', { class: 'widget exp-summary' });
  hero.append(
    el('p', { class: 'exp-summary-title' },
      brokers.length === 0
        ? 'No data brokers seen yet'
        : `${brokers.length} data broker${brokers.length === 1 ? '' : 's'} seen on sites you visit`),
    el('p', { class: 'muted' },
      brokers.length === 0
        ? 'Data brokers buy and sell personal data. If their trackers appear on sites you visit, they will show up here.'
        : 'These companies buy and sell personal data. Their trackers loaded on sites you visited in the last 90 days.'),
  );
  wrap.append(hero);

  // ── Interests they may infer ─────────────────────────────────────────────
  if (catProfiles.length > 0 && brokers.length > 0) {
    const shown = catProfiles.slice(0, 8).map((c) => c.category);
    const more = catProfiles.length > 8 ? `, +${catProfiles.length - 8} more` : '';
    wrap.append(widget('Interests they may infer', el('p', { class: 'exp-interests' }, shown.join(' · ') + more)));
  }

  // ── Every broker we saw (nothing hidden) ─────────────────────────────────
  if (brokers.length > 0) {
    const list = el('div', { class: 'list' });
    for (const b of brokers) {
      const row = el('button', { class: 'crow-btn', type: 'button' });
      row.append(
        el('span', { class: 'cname' }, b.entity),
        el('span', { class: 'cmeta muted' }, `Sells data · ${b.sites} site${b.sites === 1 ? '' : 's'}`),
        icon('chevron-right', 16, 'chev'),
      );
      row.addEventListener('click', () => openCompanyDetail(b.entity, b.category));
      list.append(row);
    }
    wrap.append(widget('Data brokers seen', list, proNote()));
  }

  // ── Email breach check ────────────────────────────────────────────────────
  wrap.append(buildBreachWidget());

  root.replaceChildren(wrap);
}

/** Honest pointer to Pro (not live yet): no gate, no email capture that goes nowhere. */
function proNote(): HTMLElement {
  const note = el('p', { class: 'pro-note muted' },
    'Coming in Datawake Pro: opt-out guides, ready-to-send removal requests and breach alerts. ');
  note.append(el('a', { href: 'https://datawake.app/pricing', target: '_blank', rel: 'noopener' }, 'Learn more'));
  return note;
}

// ── Breach widget (self-contained stateful DOM) ───────────────────────────

function buildBreachWidget(): HTMLElement {
  const outer = el('div', { class: 'widget' });
  outer.append(el('div', { class: 'widget-h' }, 'Email breach check'));
  const body = el('div', { class: 'widget-body' });
  outer.append(body);

  const key = loadKey();
  if (!key) {
    renderSetup(body);
  } else {
    renderForm(body);
  }

  return outer;
}

function renderSetup(body: HTMLElement): void {
  body.replaceChildren();

  const desc = el(
    'p',
    { class: 'breach-desc' },
    'Check if your email appeared in known data breaches using Have I Been Pwned, the industry standard. Your email goes directly from your browser to HIBP; Datawake never sees it.',
  );

  const keyForm = el('div', { class: 'breach-key-form' });

  const label = el('p', { class: 'breach-key-label' });
  label.append(
    'Paste your HIBP API key below. ',
    el('a', { href: 'https://haveibeenpwned.com/API/Key', target: '_blank', class: 'breach-link' }, 'get one at haveibeenpwned.com'),
    ' (personal use, ~$3.50/yr).',
  );

  const row = el('div', { class: 'breach-row' });
  const keyInput = el('input', {
    type: 'password',
    placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    class: 'breach-key-input',
    autocomplete: 'off',
  }) as HTMLInputElement;
  const saveBtn = el('button', { class: 'btn breach-save-btn', type: 'button' }, 'Save key');
  saveBtn.addEventListener('click', () => {
    const v = keyInput.value.trim();
    if (!v) return;
    saveKey(v);
    renderForm(body);
  });
  row.append(keyInput, saveBtn);
  keyForm.append(label, row);
  body.append(desc, keyForm);
}

function renderForm(body: HTMLElement): void {
  body.replaceChildren();

  const topRow = el('div', { class: 'breach-top-row' });
  topRow.append(
    el('p', { class: 'breach-desc', style: 'margin:0;flex:1' }, 'Enter an email address to check it against known data breaches.'),
  );
  const changeKey = el('button', { class: 'breach-change-key', type: 'button' }, 'Change API key');
  changeKey.addEventListener('click', () => {
    saveKey('');
    renderSetup(body);
  });
  topRow.append(changeKey);
  body.append(topRow);

  const row = el('div', { class: 'breach-row', style: 'margin-top:12px' });
  const emailInput = el('input', {
    type: 'email',
    placeholder: 'your@email.com',
    class: 'breach-email-input',
    autocomplete: 'email',
  }) as HTMLInputElement;
  const checkBtn = el('button', { class: 'btn breach-check-btn', type: 'button' }) as HTMLButtonElement;
  checkBtn.append(icon('search', 15), el('span', {}, 'Check'));
  row.append(emailInput, checkBtn);
  body.append(row);

  const resultsArea = el('div', { class: 'breach-results-area' });
  body.append(resultsArea);

  const runCheck = async (): Promise<void> => {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
      emailInput.focus();
      return;
    }
    const apiKey = loadKey();
    if (!apiKey) {
      renderSetup(body);
      return;
    }

    checkBtn.disabled = true;
    emailInput.disabled = true;
    resultsArea.replaceChildren(loadingRow());

    try {
      const breaches = await checkBreaches(email, apiKey);
      renderResults(resultsArea, email, breaches);
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      renderError(resultsArea, code);
      if (code === 401) {
        saveKey('');
        renderSetup(body);
        return;
      }
    } finally {
      checkBtn.disabled = false;
      emailInput.disabled = false;
    }
  };

  checkBtn.addEventListener('click', () => void runCheck());
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void runCheck();
  });
}

function renderResults(area: HTMLElement, email: string, breaches: Breach[]): void {
  area.replaceChildren();

  if (breaches.length === 0) {
    const ok = el('div', { class: 'breach-ok' });
    ok.append(icon('shield', 22, 'breach-ok-ic'), el('span', {}, `No breaches found for ${email}`));
    area.append(ok);
    return;
  }

  const summary = el('div', { class: 'breach-summary' });
  summary.append(
    el('span', { class: 'breach-summary-num' }, String(breaches.length)),
    el('span', { class: 'breach-summary-lbl' }, ` breach${breaches.length === 1 ? '' : 'es'} found for ${email}`),
  );
  area.append(summary);

  const list = el('div', { class: 'breach-list' });
  for (const b of breaches) {
    const item = el('div', { class: 'breach-item' });

    const head = el('div', { class: 'breach-item-head' });
    head.append(
      el('span', { class: 'breach-item-name' }, b.Title),
      el('span', { class: 'breach-item-date muted' }, b.BreachDate.slice(0, 7)),
    );
    item.append(head);

    if (b.DataClasses.length > 0) {
      const chips = el('div', { class: 'breach-item-classes' });
      for (const dc of b.DataClasses) {
        chips.append(el('span', { class: 'breach-dc-chip' }, dc));
      }
      item.append(chips);
    }

    list.append(item);
  }
  area.append(list);
}

function renderError(area: HTMLElement, code?: number): void {
  area.replaceChildren();
  let msg = 'Something went wrong. Please try again.';
  if (code === 401) msg = 'Invalid API key. Re-enter your key below.';
  if (code === 429) msg = 'Too many checks at once. Wait a minute and try again.';
  area.append(el('p', { class: 'breach-error' }, msg));
}

function loadingRow(): HTMLElement {
  const row = el('div', { class: 'breach-loading' });
  row.append(el('div', { class: 'skeleton', style: 'height:36px;border-radius:9px;flex:1' }));
  return row;
}

function skeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  box.append(el('div', { class: 'skeleton', style: 'height:90px;border-radius:12px' }));
  box.append(el('div', { class: 'skeleton', style: 'height:72px;border-radius:12px' }));
  box.append(el('div', { class: 'widget skeleton', style: 'height:200px' }));
  return box;
}
