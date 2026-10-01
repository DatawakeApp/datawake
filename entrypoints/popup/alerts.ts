/**
 * Popup alerts as compact rows: coloured dot, short title, a few words of summary. Tap a row to
 * see the details (native <details>, so it works with keyboard and screen readers too). Only the
 * "tracked after you said no" alert opens by default, because it is rare and it matters most.
 */
import type { ViolationRecord } from '../../lib/detection/tracker-store';
import type { FpFinding } from '../../lib/fingerprint/findings';
import type { FpTechnique } from '../../lib/fingerprint/detector';
import { groupViolationCookiesByCompany } from '../../lib/cookies/describe';
import { shareReceipt } from '../../lib/receipt/share';
import type { ReceiptInput } from '../../lib/receipt/model';
import { fingerprintersAfterReject } from '../../lib/fingerprint/after-reject';
import { icon } from '../../lib/ui/icons';

type Tone = 'ok' | 'violation' | 'fingerprint' | 'security' | 'replay' | 'pay' | 'info';

interface AlertRowOptions {
  tone: Tone;
  title: string;
  summary?: string;
  /** Shown when the row is expanded. No details means a plain, non-expandable row. */
  details?: Node[];
  open?: boolean;
}

function text(tag: string, cls: string, value: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = cls;
  node.textContent = value;
  return node;
}

function alertRow({ tone, title, summary, details, open = false }: AlertRowOptions): HTMLElement {
  const head: Node[] = [text('span', 'alert-dot', ''), text('span', 'alert-title', title)];
  if (summary) head.push(text('span', 'alert-summary', summary));

  if (!details || details.length === 0) {
    const row = document.createElement('div');
    row.className = `alert-row static tone-${tone}`;
    const line = document.createElement('div');
    line.className = 'alert-line';
    line.append(...head);
    row.append(line);
    return row;
  }

  const row = document.createElement('details');
  row.className = `alert-row tone-${tone}`;
  row.open = open;
  const line = document.createElement('summary');
  line.className = 'alert-line';
  line.append(...head, icon('chevron-down', 14, 'alert-chevron'));
  const body = document.createElement('div');
  body.className = 'alert-details';
  body.append(...details);
  row.append(line, body);
  return row;
}

function listWords(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

// ── The alerts ───────────────────────────────────────────────────────────────

/** Auto-reject worked on this page: one quiet green line. */
export function rejectedAlert(): HTMLElement {
  return alertRow({ tone: 'ok', title: 'Cookies rejected for you' });
}

export function violationAlert(v: ViolationRecord, site: string | null, fingerprinters: readonly string[] = []): HTMLElement {
  const groups = groupViolationCookiesByCompany(v.newCookies);
  const n = v.newCookies.length;

  const list = document.createElement('div');
  list.className = 'alert-viol-list';
  for (const g of groups.slice(0, 4)) {
    const item = document.createElement('div');
    item.className = 'alert-viol-co';
    const names = g.cookies.map((c) => c.name).slice(0, 3).join(', ');
    item.append(
      text('span', 'alert-viol-co-name', g.company),
      text('span', 'alert-viol-co-meta', names + (g.cookies.length > 3 ? ` +${g.cookies.length - 3}` : '')),
    );
    list.append(item, text('div', 'alert-viol-co-purpose', g.cookies[0].purpose));
  }
  if (groups.length > 4) {
    list.append(text('div', 'alert-viol-more', `+${plural(groups.length - 4, 'more company', 'more companies')}`));
  }

  const share = shareButton({ site: site ?? 'this site', timestamp: v.detectedAt, newCookies: v.newCookies, fingerprinters });

  return alertRow({
    tone: 'violation',
    title: 'Tracked after you said no',
    summary: `${plural(n, 'cookie', 'cookies')}, ${plural(groups.length, 'company', 'companies')}`,
    details: [
      text('p', 'alert-body', `You clicked Reject, and this site set ${plural(n, 'tracking cookie', 'tracking cookies')} anyway.`),
      list,
      share,
    ],
    open: true,
  });
}

function shareButton(input: ReceiptInput): HTMLButtonElement {
  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'viol-share-btn';
  share.append(icon('share', 14), document.createTextNode('Share this receipt'));
  share.addEventListener('click', () => void handleShare(share, input));
  return share;
}

/** Drive a share button's pending/done label around shareReceipt(). */
async function handleShare(btn: HTMLButtonElement, input: ReceiptInput): Promise<void> {
  if (btn.disabled) return;
  const restore = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Preparing…';
  const outcome = await shareReceipt(input);
  btn.textContent =
    outcome.kind === 'shared' ? 'Shared ✓'
    : outcome.kind === 'downloaded' ? (outcome.captionCopied ? 'Saved, caption copied ✓' : 'Receipt saved ✓')
    : outcome.kind === 'cancelled' ? 'Share this receipt'
    : 'Could not create receipt';
  window.setTimeout(() => {
    btn.innerHTML = restore;
    btn.disabled = false;
  }, 2600);
}

/** What each fingerprinting technique reads, in plain words. */
const TECHNIQUE_WORDS: Record<FpTechnique, string> = {
  canvas: 'how your screen draws text',
  audio: 'how your device plays sound',
  fonts: 'which fonts you have',
  webgl: 'your graphics card',
  device: 'your hardware details',
};

/** Findings that count as tracking (bot and fraud protection is shown, but never claimed). */
export function claimableFingerprints(findings: readonly FpFinding[]): FpFinding[] {
  return findings.filter((f) => f.purpose !== 'security');
}

const whoFingerprinted = (f: FpFinding): string => (f.firstParty ? 'This site' : f.company ?? f.domain);

/**
 * `receipt` is set when there is no cookie violation card to carry the share button, so a
 * fingerprint-only violation can still be shared.
 */
export function fingerprintAlert(
  findings: readonly FpFinding[],
  receipt?: { site: string; timestamp: number },
): HTMLElement {
  const tracking = claimableFingerprints(findings);
  const securityOnly = tracking.length === 0;
  const shown = securityOnly ? findings : tracking;
  const afterReject = tracking.some((f) => f.afterReject);
  const who = shown.map(whoFingerprinted);

  const list = document.createElement('ul');
  list.className = 'fp-list';
  for (const f of [...tracking, ...findings.filter((x) => x.purpose === 'security')]) {
    const li = document.createElement('li');
    const label = whoFingerprinted(f) + (f.purpose === 'security' ? ' (bot and fraud checks)' : '');
    li.append(text('strong', '', label), `: ${listWords(f.techniques.map((t) => TECHNIQUE_WORDS[t]))}`);
    list.append(li);
  }

  const explanation = securityOnly
    ? 'A security service looked at your device to check you are not a bot. Sites use this to stop fake accounts and fraud.'
    : 'This page identified your device without cookies, so clearing cookies will not stop it.' +
      (afterReject ? ' Some of it happened after you clicked Reject.' : '');

  return alertRow({
    tone: securityOnly ? 'security' : 'fingerprint',
    title: securityOnly ? 'Bot check' : afterReject ? 'Fingerprinted after Reject' : 'Device fingerprinting',
    summary: who.slice(0, 2).join(', ') + (who.length > 2 ? ` +${who.length - 2}` : ''),
    details: [
      text('p', 'alert-body', explanation),
      list,
      ...(afterReject && receipt
        ? [shareButton({ ...receipt, newCookies: [], fingerprinters: fingerprintersAfterReject(findings) })]
        : []),
    ],
  });
}

export function sessionReplayAlert(tools: string[]): HTMLElement {
  const names = tools.slice(0, 2).join(' and ') + (tools.length > 2 ? ` and ${tools.length - 2} more` : '');
  return alertRow({
    tone: 'replay',
    title: 'Recording your screen',
    summary: tools.slice(0, 2).join(', '),
    details: [
      text('p', 'alert-body', `${names} ${tools.length === 1 ? 'records' : 'record'} your mouse, clicks and typing on this page. You may not have agreed to this.`),
    ],
  });
}

export function payOrOkAlert(autoReject: boolean): HTMLElement {
  return alertRow({
    tone: 'pay',
    title: 'Pay to say no',
    summary: autoReject ? 'not rejected' : undefined,
    details: [
      text('p', 'alert-body', 'This site only lets you refuse tracking if you buy a subscription.' +
        (autoReject ? ' Datawake did not reject for you, because that would take you to a paywall.' : '')),
    ],
  });
}

export function vendorCountAlert(count: number): HTMLElement {
  return alertRow({
    tone: 'info',
    title: `${count.toLocaleString('en-US')} companies want to track you`,
  });
}
