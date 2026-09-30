import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { historyStats, adProfileStats } from '../../../lib/storage/db';
import { dataFlow, sharingColor } from '../../../lib/brokers/flows';
import { openCompanyDetail } from './detail';
import { loadKey, saveKey, checkBreaches, type Breach } from '../../../lib/breach/hibp';

const DAY = 86_400_000;

const RISK_COLORS: Record<string, string> = {
  none: '#7e8a99',
  low: '#5bd6a5',
  medium: '#f1c40f',
  high: '#ffb066',
  critical: '#f1707a',
};

const RISK_LABELS: Record<string, string> = {
  none: 'No brokers detected',
  low: 'Low exposure',
  medium: 'Medium exposure',
  high: 'High exposure',
  critical: 'Critical exposure',
};

function riskLevel(n: number): string {
  if (n === 0) return 'none';
  if (n <= 2) return 'low';
  if (n <= 5) return 'medium';
  if (n <= 10) return 'high';
  return 'critical';
}

export async function renderExposure(root: HTMLElement): Promise<void> {
  root.replaceChildren(skeleton());

  const [stats, catProfiles] = await Promise.all([historyStats(90 * DAY), adProfileStats()]);
  const known = stats.entities.filter((e) => e.known);
  const brokers = known.filter((e) => dataFlow(e.entity)?.sharing === 'sells');

  const level = riskLevel(brokers.length);
  const riskColor = RISK_COLORS[level];
  const FREE_LIMIT = 2;

  const wrap = el('div', { class: 'stack' });

  // ── Risk hero ────────────────────────────────────────────────────────────
  const hero = el('div', { class: 'exp-hero', style: `border-left-color:${riskColor}` });
  const heroLeft = el('div', { class: 'exp-hero-left' });
  heroLeft.append(icon('shield', 28, 'exp-shield-ic'));
  const heroMid = el('div', { style: 'flex:1;min-width:0' });

  if (brokers.length === 0) {
    heroMid.append(el('p', { class: 'exp-hero-title' }, 'No data brokers detected yet.'));
    heroMid.append(
      el('p', { class: 'exp-hero-sub' }, 'Browse more sites and data broker activity will show up here.'),
    );
  } else {
    const titleEl = el('p', { class: 'exp-hero-title' });
    titleEl.append(
      el('span', { class: 'exp-hero-num', style: `color:${riskColor}` }, String(brokers.length)),
      ` data broker${brokers.length === 1 ? '' : 's'} ${brokers.length === 1 ? 'is' : 'are'} actively profiling you`,
    );
    heroMid.append(titleEl);
    heroMid.append(
      el('p', { class: 'exp-hero-sub' }, 'Based on tracker activity recorded over the last 90 days.'),
    );
  }

  const riskBadge = el(
    'span',
    { class: 'exp-risk-badge', style: `background:${riskColor}20;color:${riskColor};border-color:${riskColor}40` },
    RISK_LABELS[level],
  );
  hero.append(heroLeft, heroMid, riskBadge);
  wrap.append(hero);

  // ── What they likely know ────────────────────────────────────────────────
  if (catProfiles.length > 0 && brokers.length > 0) {
    const knows = el('div', { class: 'widget' });
    knows.append(el('div', { class: 'widget-h' }, 'What they likely know about you'));
    const body = el('div', { class: 'widget-body exp-cats' });
    for (const c of catProfiles.slice(0, 8)) {
      body.append(
        el('span', { class: 'exp-cat-chip', style: `border-color:${c.color}30;background:${c.color}12;color:${c.color}` }, c.category),
      );
    }
    if (catProfiles.length > 8) {
      body.append(el('span', { class: 'exp-cat-more' }, `+${catProfiles.length - 8} more`));
    }
    knows.append(body);
    wrap.append(knows);
  }

  // ── Broker list ──────────────────────────────────────────────────────────
  if (brokers.length > 0) {
    const listWrap = el('div', { class: 'widget' });
    listWrap.append(el('div', { class: 'widget-h' }, 'Data brokers detected'));
    const listBody = el('div', { class: 'widget-body' });
    const list = el('div', { class: 'list' });

    for (const b of brokers.slice(0, FREE_LIMIT)) {
      const row = el('button', {
        class: 'crow-btn',
        type: 'button',
        style: `border-left-color:${sharingColor('sells')}`,
      });
      row.append(
        el('span', { class: 'cname' }, b.entity),
        el('span', {
          class: 'cbadge',
          style: `color:${sharingColor('sells')};border-color:${sharingColor('sells')}40`,
        }, 'Sells data'),
        el('span', { class: 'cmeta muted' }, `${b.sites} site${b.sites === 1 ? '' : 's'}`),
        icon('chevron-right', 16, 'chev'),
      );
      row.addEventListener('click', () => openCompanyDetail(b.entity, b.category));
      list.append(row);
    }

    const locked = brokers.slice(FREE_LIMIT);
    if (locked.length > 0) {
      const teaser = el('div', { class: 'crow-btn exp-blurred', 'aria-hidden': 'true' });
      teaser.append(
        el('span', { class: 'cname' }, locked[0].entity),
        el('span', { class: 'cbadge' }, 'Sells data'),
        el('span', { class: 'cmeta muted' }, `${locked[0].sites} sites`),
      );
      list.append(teaser);
      listBody.append(list);
      listBody.append(proGate(locked.length, catProfiles[0]?.category ?? 'your browsing'));
    } else {
      listBody.append(list);
    }

    listWrap.append(listBody);
    wrap.append(listWrap);
  }

  // ── Email breach check ────────────────────────────────────────────────────
  wrap.append(buildBreachWidget());

  root.replaceChildren(wrap);
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

// ── Pro gate ─────────────────────────────────────────────────────────────

function proGate(lockedCount: number, topCategory: string): HTMLElement {
  const gate = el('div', { class: 'pro-gate' });

  const lockRow = el('div', { class: 'pro-gate-top' });
  lockRow.append(
    icon('shield', 20, 'pro-gate-ic'),
    el('span', { class: 'pro-gate-count' }, `${lockedCount} more broker${lockedCount === 1 ? '' : 's'} detected`),
  );
  gate.append(lockRow);
  gate.append(
    el(
      'p',
      { class: 'pro-gate-desc' },
      `Unlock Datawake Pro to see exactly who has your "${topCategory}" profile, send opt-out requests, and get monitoring alerts when new breaches include your email.`,
    ),
  );

  const features = el('ul', { class: 'pro-gate-features' });
  [
    'Full data broker list with opt-out guides',
    'Pre-written GDPR & CCPA removal requests',
    'Removal request tracker',
    'Breach monitoring alerts for your email',
  ].forEach((f) => features.append(el('li', {}, f)));
  gate.append(features);

  const cta = el('button', { class: 'btn pro-gate-btn', type: 'button' });
  cta.append(icon('shield', 15), el('span', {}, 'Join the Pro waitlist'));
  cta.addEventListener('click', () => showWaitlist(cta));
  gate.append(cta);
  return gate;
}

function showWaitlist(trigger: HTMLElement): void {
  const parent = trigger.closest('.pro-gate') as HTMLElement;
  if (!parent) return;

  const form = el('div', { class: 'pro-waitlist', style: 'margin-top:12px' });
  const input = el('input', {
    type: 'email',
    placeholder: 'your@email.com',
    class: 'breach-email-input',
    autocomplete: 'email',
    style: 'flex:1',
  }) as HTMLInputElement;
  const submitBtn = el('button', { class: 'btn', type: 'button', style: 'white-space:nowrap' }, 'Notify me') as HTMLButtonElement;

  submitBtn.addEventListener('click', () => {
    const email = input.value.trim();
    if (!email || !email.includes('@')) { input.focus(); return; }
    form.replaceChildren(
      el('p', { style: 'color:var(--accent);font-size:13.5px;margin:0' }, `Thanks! We'll email ${email} when Pro launches.`),
    );
  });

  const row = el('div', { style: 'display:flex;gap:8px;margin-bottom:4px' }, input, submitBtn);
  form.append(row, el('p', { style: 'font-size:12px;color:var(--muted);margin:0' }, 'Datawake Pro is coming soon. Enter your email for early access.'));

  trigger.replaceWith(form);
}

function skeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  box.append(el('div', { class: 'skeleton', style: 'height:90px;border-radius:12px' }));
  box.append(el('div', { class: 'skeleton', style: 'height:72px;border-radius:12px' }));
  box.append(el('div', { class: 'widget skeleton', style: 'height:200px' }));
  return box;
}
