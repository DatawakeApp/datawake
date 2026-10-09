/** Email breach check, shown under Take action. Nothing to set up: see lib/breach/lookup.ts. */
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { BREACH_SOURCE, BreachLookupError, checkBreaches, type Breach } from '../../../lib/breach/lookup';

/** Breaches listed before "Show all". */
const SHOWN = 10;

export function buildBreachWidget(): HTMLElement {
  const outer = el('div', { class: 'widget' });
  outer.append(el('div', { class: 'widget-h' }, 'Email breach check'));
  const body = el('div', { class: 'widget-body' });
  outer.append(body);

  body.append(el('p', { class: 'breach-desc' }, 'See whether an email address appears in a known data breach, and what leaked. Datawake never sees or stores the address.'));

  const row = el('div', { class: 'breach-row' });
  const emailInput = el('input', {
    type: 'email',
    placeholder: 'your@email.com',
    class: 'breach-email-input',
    autocomplete: 'email',
    'aria-label': 'Email address to check',
  }) as HTMLInputElement;
  const checkBtn = el('button', { class: 'btn breach-check-btn', type: 'button' }) as HTMLButtonElement;
  checkBtn.append(icon('search', 15), el('span', {}, 'Check'));
  row.append(emailInput, checkBtn);

  const resultsArea = el('div', { class: 'breach-results-area' });
  body.append(row, resultsArea);

  const runCheck = async (): Promise<void> => {
    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.focus();
      resultsArea.replaceChildren(el('p', { class: 'breach-error' }, 'Enter a valid email address.'));
      return;
    }
    // Firefox asks the user before an add-on sends personal data off the device.
    if (!(await allowSendingEmail())) {
      resultsArea.replaceChildren(el('p', { class: 'breach-error' }, 'The check needs your permission to send this address to the breach database.'));
      return;
    }
    checkBtn.disabled = true;
    emailInput.disabled = true;
    resultsArea.replaceChildren(el('div', { class: 'breach-loading' }, el('div', { class: 'skeleton', style: 'height:36px;border-radius:9px;flex:1' })));
    try {
      renderResults(resultsArea, email, await checkBreaches(email));
    } catch (err: unknown) {
      const tooMany = err instanceof BreachLookupError && err.status === 429;
      resultsArea.replaceChildren(el('p', { class: 'breach-error' }, tooMany
        ? 'Too many checks from this connection. Wait a minute and try again.'
        : 'The check could not run just now. Check your connection and try again.'));
    } finally {
      checkBtn.disabled = false;
      emailInput.disabled = false;
    }
  };

  checkBtn.addEventListener('click', () => void runCheck());
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void runCheck();
  });
  return outer;
}

/** The data provider's terms ask for a credit wherever its results are shown. */
function sourceCredit(): HTMLElement {
  const credit = el('p', { class: 'breach-credit muted' }, 'Breach data: ');
  credit.append(el('a', { href: BREACH_SOURCE.url, target: '_blank', rel: 'noopener noreferrer' }, BREACH_SOURCE.name));
  return credit;
}

function renderResults(area: HTMLElement, email: string, breaches: Breach[]): void {
  if (breaches.length === 0) {
    const ok = el('div', { class: 'breach-ok' });
    ok.append(icon('shield', 22, 'breach-ok-ic'), el('span', {}, `${email} is not in any breach on record.`));
    area.replaceChildren(ok, sourceCredit());
    return;
  }

  const summary = el('div', { class: 'breach-summary' },
    el('span', { class: 'breach-summary-num' }, String(breaches.length)),
    el('span', { class: 'breach-summary-lbl' }, ` breach${breaches.length === 1 ? '' : 'es'} include ${email}`),
  );
  const list = el('div', { class: 'breach-list' });
  const draw = (limit: number): void => {
    list.replaceChildren(...breaches.slice(0, limit).map(breachItem));
    if (breaches.length > limit) {
      const more = el('button', { class: 'btn secondary', type: 'button' }, `Show all ${breaches.length}`);
      more.addEventListener('click', () => draw(breaches.length));
      list.append(more);
    }
  };
  draw(SHOWN);
  area.replaceChildren(summary, list, sourceCredit());
}

function breachItem(b: Breach): HTMLElement {
  const meta = [b.year, b.records ? `${formatCount(b.records)} accounts` : ''].filter(Boolean).join(' · ');
  const item = el('div', { class: 'breach-item' },
    el('div', { class: 'breach-item-head' },
      el('span', { class: 'breach-item-name' }, b.name),
      el('span', { class: 'breach-item-date muted' }, meta),
    ),
  );
  const chips = el('div', { class: 'breach-item-classes' });
  if (b.plaintextPasswords) chips.append(el('span', { class: 'breach-dc-chip breach-dc-warn' }, 'Passwords in plain text'));
  for (const d of b.exposed.slice(0, 6)) chips.append(el('span', { class: 'breach-dc-chip' }, d));
  if (b.exposed.length > 6) chips.append(el('span', { class: 'breach-dc-chip' }, `+${b.exposed.length - 6} more`));
  if (chips.childElementCount) item.append(chips);
  return item;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/**
 * Firefox's built-in data consent: request it on first use (must run straight from the click).
 * Other browsers have no such prompt; the store listing and privacy policy cover them. Firefox 140+
 * is required by the manifest, so the API is always there.
 */
async function allowSendingEmail(): Promise<boolean> {
  if (!import.meta.env.FIREFOX) return true;
  const request = { data_collection: ['personallyIdentifyingInfo'] } as unknown as Parameters<typeof browser.permissions.request>[0];
  try {
    // Called first, straight from the click, so Firefox can show its prompt (it resolves at once
    // when the user already agreed).
    return await browser.permissions.request(request);
  } catch {
    return false; // never send without a clear yes
  }
}
