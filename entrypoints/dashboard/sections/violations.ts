import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { listViolations, clearViolations, listActions } from '../../../lib/storage/db';
import type { ViolationEntry } from '../../../lib/storage/db';
import { groupViolationCookiesByCompany } from '../../../lib/cookies/describe';
import { shareReceipt } from '../../../lib/receipt/share';
import { openReportSheet } from './report-sheet';
import type { ReceiptInput } from '../../../lib/receipt/model';

const evidenceOf = (v: ViolationEntry) => ({ site: v.site, url: v.url, timestamp: v.timestamp, newCookies: v.newCookies, fingerprinters: v.fingerprinters ?? [] });

/** `arg` "report=<site>" opens the complaint for that site's latest violation (from the popup). */
export async function renderViolations(root: HTMLElement, arg?: string): Promise<void> {
  root.replaceChildren(skeleton());
  const rows = await listViolations();

  if (rows.length === 0) {
    const checked = new Set((await listActions()).filter((a) => a.kind === 'rejected').map((a) => a.site)).size;
    root.replaceChildren(
      el('div', { class: 'empty' },
        icon('shield', 36, 'empty-ic'),
        el('p', { class: 'empty-title' }, checked > 0 ? 'Every site respected your Reject' : 'No violations caught yet'),
        el('p', { class: 'muted' }, checked > 0
          ? `Datawake said no on ${checked} ${checked === 1 ? 'site' : 'sites'} and watched what happened next. None kept tracking you with cookies or fingerprinting.`
          : 'When a site ignores your Reject and tracks you anyway, with cookies or by fingerprinting your device, it will appear here with the evidence.'),
      ),
    );
    return;
  }

  const wrap = el('div', { class: 'stack' });

  // ── Summary stat ──────────────────────────────────────────────────────────
  const totalCookies = rows.reduce((s, r) => s + r.newCookies.length, 0);
  const uniqueSites = new Set(rows.map((r) => r.site)).size;

  const summary = el('div', { class: 'widget' });
  const statsRow = el('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;padding:16px' });
  statsRow.append(
    statPill(String(rows.length), rows.length === 1 ? 'violation caught' : 'violations caught'),
    statPill(String(uniqueSites), uniqueSites === 1 ? 'site' : 'sites'),
    statPill(String(totalCookies), totalCookies === 1 ? 'tracking cookie set after Reject' : 'tracking cookies set after Reject'),
  );
  summary.append(
    el('div', { class: 'widget-h', style: 'display:flex;align-items:center;gap:8px' },
      el('span', { style: 'flex:1' }, 'Sites that tracked you after you said no'),
      clearBtn(() => {
        void clearViolations().then(() => renderViolations(root));
      }),
    ),
    statsRow,
  );
  wrap.append(summary);

  // ── Violation list ────────────────────────────────────────────────────────
  const listWrap = el('div', { class: 'widget' });
  listWrap.append(el('div', { class: 'widget-h' }, 'Violation log'));

  const grouped = groupByDate(rows);

  for (const { label, items } of grouped) {
    const group = el('div', { class: 'viol-group' });
    group.append(el('div', { class: 'viol-date-label' }, label));
    for (const v of items) {
      group.append(violationRow(v));
    }
    listWrap.append(group);
  }

  wrap.append(listWrap);
  root.replaceChildren(wrap);

  const reportSite = arg?.startsWith('report=') ? decodeURIComponent(arg.slice(7)) : null;
  const target = reportSite ? rows.find((r) => r.site === reportSite) : undefined;
  if (target) void openReportSheet(evidenceOf(target));
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

function violationSummary(cookies: number, companies: number, fingerprinters: number): string {
  const fp = `${plural(fingerprinters, 'company', 'companies')} fingerprinted your device`;
  if (cookies === 0) return `${fp} after you clicked Reject`;
  const base = `${plural(cookies, 'tracking cookie', 'tracking cookies')} from ${plural(companies, 'company', 'companies')}`;
  return fingerprinters > 0 ? `${base}, and ${fp}, after you clicked Reject` : `${base}, set after you clicked Reject`;
}

function violationRow(v: ViolationEntry): HTMLElement {
  const row = el('div', { class: 'viol-row' });

  const left = el('div', { class: 'viol-left' });
  const siteName = el('div', { class: 'viol-site' }, v.site);
  const cookieCount = v.newCookies.length;
  const groups = groupViolationCookiesByCompany(v.newCookies);
  const companyCount = groups.length;
  const fingerprinters = v.fingerprinters ?? [];
  const detail = el('div', { class: 'viol-detail' }, violationSummary(cookieCount, companyCount, fingerprinters.length));
  left.append(siteName, detail);

  const badge = el('div', { class: 'viol-badge' }, String(cookieCount + fingerprinters.length));

  const time = el('div', { class: 'viol-time' }, formatTime(v.timestamp));

  row.append(left, time, badge);

  // Expandable: who set what, and what each cookie does
  const bodyEl = el('div', { class: 'viol-body' });
  bodyEl.hidden = true;

  for (const g of groups) {
    const group = el('div', { class: 'viol-co-group' });
    group.append(el('div', { class: 'viol-co-name' },
      g.company,
      el('span', { class: 'viol-co-count' }, `${g.cookies.length} ${g.cookies.length === 1 ? 'cookie' : 'cookies'}`),
    ));
    for (const c of g.cookies.slice(0, 8)) {
      group.append(el('div', { class: 'viol-cookie-item' },
        el('span', { class: 'viol-cookie-name' }, c.name),
        el('span', { class: 'viol-cookie-purpose' }, c.purpose),
      ));
    }
    if (g.cookies.length > 8) {
      group.append(el('div', { class: 'viol-more' }, `+${g.cookies.length - 8} more`));
    }
    bodyEl.append(group);
  }
  if (fingerprinters.length > 0) {
    const group = el('div', { class: 'viol-co-group' });
    group.append(el('div', { class: 'viol-co-name' }, 'Device fingerprinting after Reject'));
    for (const name of fingerprinters) {
      group.append(el('div', { class: 'viol-cookie-item' },
        el('span', { class: 'viol-cookie-name' }, name),
        el('span', { class: 'viol-cookie-purpose' }, 'Identified your device without cookies'),
      ));
    }
    bodyEl.append(group);
  }
  row.append(bodyEl);

  // Share-receipt button. Sits inside the expandable body.
  const share = el('button', { type: 'button', class: 'viol-share-btn' },
    icon('share', 14), 'Share this receipt') as HTMLButtonElement;
  share.addEventListener('click', (e) => {
    e.stopPropagation();
    void handleShare(share, { site: v.site, timestamp: v.timestamp, newCookies: v.newCookies, fingerprinters });
  });
  const report = el('button', { type: 'button', class: 'viol-share-btn viol-report-btn' }, icon('mail', 14), 'Report this site') as HTMLButtonElement;
  report.addEventListener('click', (e) => {
    e.stopPropagation();
    void openReportSheet(evidenceOf(v));
  });
  bodyEl.append(el('div', { class: 'viol-share-wrap' }, report, share));

  row.addEventListener('click', () => {
    bodyEl.hidden = !bodyEl.hidden;
    row.classList.toggle('open', !bodyEl.hidden);
  });

  return row;
}

/** Drive a share button's pending/done label around shareReceipt(). */
async function handleShare(
  btn: HTMLButtonElement,
  input: ReceiptInput,
): Promise<void> {
  if (btn.disabled) return;
  const restore = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Preparing…';
  const outcome = await shareReceipt(input);
  btn.textContent =
    outcome.kind === 'shared' ? 'Shared ✓'
    : outcome.kind === 'downloaded' ? (outcome.captionCopied ? 'Saved + caption copied ✓' : 'Receipt saved ✓')
    : outcome.kind === 'cancelled' ? 'Share this receipt'
    : 'Could not create receipt';
  window.setTimeout(() => {
    btn.innerHTML = restore;
    btn.disabled = false;
  }, 2600);
}

function clearBtn(onClick: () => void): HTMLElement {
  const btn = el('button', {
    type: 'button',
    style: 'font-size:11px;font-weight:600;color:var(--muted);background:transparent;border:1px solid var(--border);border-radius:6px;padding:3px 10px;cursor:pointer',
  }, 'Clear all');
  btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

function statPill(value: string, label: string): HTMLElement {
  const pill = el('div', { class: 'profile-stat-pill' });
  pill.append(
    el('span', { class: 'profile-stat-num' }, value),
    el('span', { class: 'profile-stat-lbl' }, label),
  );
  return pill;
}

interface DateGroup { label: string; items: ViolationEntry[] }

function groupByDate(rows: ViolationEntry[]): DateGroup[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const map = new Map<string, ViolationEntry[]>();
  for (const r of rows) {
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    const label = day === todayStr ? 'Today' : day === yesterdayStr ? 'Yesterday' : formatDate(r.timestamp);
    const list = map.get(label) ?? [];
    list.push(r);
    map.set(label, list);
  }

  return [...map.entries()].map(([label, items]) => ({ label, items }));
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function skeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  box.append(el('div', { class: 'skeleton', style: 'height:80px;border-radius:12px' }));
  box.append(el('div', { class: 'skeleton', style: 'height:200px;border-radius:12px;margin-top:12px' }));
  return box;
}
