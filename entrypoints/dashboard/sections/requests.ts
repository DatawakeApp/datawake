import { el, toast } from '../dom';
import { icon } from '../../../lib/ui/icons';
import {
  historyStats,
  listRequests,
  addRequest,
  updateRequest,
  removeRequest,
  type RequestEntry,
} from '../../../lib/storage/db';
import { getSettings } from '../../../lib/settings';
import { buildLetter, type RequestKind } from '../../../lib/gdpr/templates';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  responded: 'Response received',
  done: 'Done',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--muted)',
  sent: 'var(--amber)',
  responded: 'var(--link)',
  done: 'var(--accent)',
};

export async function renderRequests(root: HTMLElement): Promise<void> {
  const [settings, stats, existing] = await Promise.all([
    getSettings(),
    historyStats(Number.MAX_SAFE_INTEGER),
    listRequests(),
  ]);

  const wrap = el('div', { class: 'stack' });

  // ── Identity gate ──────────────────────────────────────────────────────────
  const hasIdentity = settings.name.trim().length > 0 && settings.email.trim().length > 0;

  if (!hasIdentity) {
    const gate = el('div', { class: 'widget' });
    gate.append(el('div', { class: 'widget-h' }, 'Set up your identity first'));
    const body = el('div', { class: 'widget-body stack' });
    body.append(
      el('p', { class: 'muted' }, 'To generate GDPR letters we need your name and email. Go to Settings → Your identity, then come back here.'),
    );
    const goBtn = el('button', { class: 'btn', type: 'button' });
    goBtn.append(icon('settings', 15), el('span', {}, 'Open Settings'));
    goBtn.addEventListener('click', () => {
      window.location.hash = 'settings';
      document.querySelector<HTMLButtonElement>('[data-id="settings"]')?.click();
    });
    body.append(goBtn);
    gate.append(body);
    wrap.append(gate);
    root.replaceChildren(wrap);
    return;
  }

  // ── New request form ───────────────────────────────────────────────────────
  const formWrap = el('div', { class: 'widget' });
  formWrap.append(el('div', { class: 'widget-h' }, 'New request'));
  const formBody = el('div', { class: 'widget-body stack' });

  const knownCompanies = stats.entities.filter((e) => e.known).map((e) => e.entity).sort();

  const companyInput = el('input', {
    type: 'text',
    placeholder: 'Company name…',
    list: 'req-companies',
    style: 'width:100%',
  }) as HTMLInputElement;

  const datalist = el('datalist', { id: 'req-companies' });
  for (const c of knownCompanies) {
    datalist.append(el('option', { value: c }));
  }

  const kindSelect = el('select', { style: 'width:100%' }) as HTMLSelectElement;
  kindSelect.append(
    el('option', { value: 'access' }, 'Access request (Art. 15): ask what data they hold'),
    el('option', { value: 'erasure' }, 'Erasure request (Art. 17): ask them to delete your data'),
  );

  const generateBtn = el('button', { class: 'btn', type: 'button' }) as HTMLButtonElement;
  generateBtn.append(icon('content', 15), el('span', {}, 'Generate letter'));

  generateBtn.addEventListener('click', async () => {
    const company = companyInput.value.trim();
    if (!company) { companyInput.focus(); return; }
    const kind = kindSelect.value as RequestKind;
    const letter = buildLetter(kind, {
      company,
      name: settings.name,
      email: settings.email,
      address: settings.address || undefined,
    });

    const id = await addRequest({
      company,
      kind,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    companyInput.value = '';
    toast('Letter ready. Copy it below.');
    void renderRequests(root);
    // Scroll to the new draft
    setTimeout(() => {
      root.querySelector(`[data-req-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    void id; // consumed above
    void letter; // used in the row render below, regenerated from DB
  });

  formBody.append(datalist, companyInput, kindSelect, generateBtn);
  formWrap.append(formBody);
  wrap.append(formWrap);

  // ── Request list ────────────────────────────────────────────────────────────
  if (existing.length > 0) {
    const listWrap = el('div', { class: 'widget' });
    listWrap.append(el('div', { class: 'widget-h' }, `${existing.length} request${existing.length === 1 ? '' : 's'}`));
    const listBody = el('div', { class: 'widget-body list' });

    for (const req of [...existing].reverse()) {
      listBody.append(requestRow(req, settings, () => void renderRequests(root)));
    }

    listWrap.append(listBody);
    wrap.append(listWrap);
  } else {
    wrap.append(
      el('p', { class: 'muted' }, 'No requests yet. Generate your first letter above.'),
    );
  }

  root.replaceChildren(wrap);
}

function requestRow(
  req: RequestEntry,
  settings: Awaited<ReturnType<typeof getSettings>>,
  refresh: () => void,
): HTMLElement {
  const row = el('div', { class: 'card', 'data-req-id': String(req.id), style: 'margin-bottom:0' });

  const head = el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px' });
  head.append(
    el('span', { style: 'font-weight:700;font-size:14px' }, req.company),
    el('span', {
      style: `font-size:11.5px;font-weight:600;color:${STATUS_COLOR[req.status]};border:1px solid ${STATUS_COLOR[req.status]}40;border-radius:999px;padding:2px 10px`,
    }, STATUS_LABEL[req.status]),
  );
  row.append(head);

  const kindLabel = req.kind === 'access' ? 'Access request (Art. 15)' : 'Erasure request (Art. 17)';
  row.append(el('p', { style: 'font-size:12.5px;color:var(--muted);margin:0 0 10px' }, kindLabel));

  // Letter preview
  const letter = buildLetter(req.kind, {
    company: req.company,
    name: settings.name,
    email: settings.email,
    address: settings.address || undefined,
  });

  const textarea = el('textarea', {
    style: 'font-size:12px;line-height:1.55;min-height:140px;font-family:monospace',
    readOnly: 'true',
  }) as HTMLTextAreaElement;
  textarea.value = `Subject: ${letter.subject}\n\n${letter.body}`;
  row.append(textarea);

  // Actions
  const actions = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' });

  const copyBtn = el('button', { class: 'btn secondary small', type: 'button' });
  copyBtn.append(icon('content', 13), el('span', {}, 'Copy letter'));
  copyBtn.addEventListener('click', () => {
    void navigator.clipboard.writeText(textarea.value).then(() => toast('Copied to clipboard'));
  });
  actions.append(copyBtn);

  const mailBtn = el('button', { class: 'btn secondary small', type: 'button' });
  mailBtn.append(icon('external', 13), el('span', {}, 'Open in email'));
  mailBtn.addEventListener('click', () => {
    const body = encodeURIComponent(letter.body);
    const subj = encodeURIComponent(letter.subject);
    window.open(`mailto:?subject=${subj}&body=${body}`, '_blank');
  });
  actions.append(mailBtn);

  if (req.status === 'draft') {
    const markSent = el('button', { class: 'btn small', type: 'button' }, 'Mark as sent') as HTMLButtonElement;
    markSent.addEventListener('click', () => {
      if (req.id == null) return;
      void updateRequest(req.id, { status: 'sent', updatedAt: Date.now() }).then(() => {
        toast('Marked as sent');
        refresh();
      });
    });
    actions.append(markSent);
  } else if (req.status === 'sent') {
    const markResp = el('button', { class: 'btn small', type: 'button' }, 'Response received') as HTMLButtonElement;
    markResp.addEventListener('click', () => {
      if (req.id == null) return;
      void updateRequest(req.id, { status: 'responded', updatedAt: Date.now() }).then(() => {
        toast('Status updated');
        refresh();
      });
    });
    actions.append(markResp);
  } else if (req.status === 'responded') {
    const markDone = el('button', { class: 'btn small', type: 'button' }, 'Mark done') as HTMLButtonElement;
    markDone.addEventListener('click', () => {
      if (req.id == null) return;
      void updateRequest(req.id, { status: 'done', updatedAt: Date.now() }).then(() => {
        toast('Request closed');
        refresh();
      });
    });
    actions.append(markDone);
  }

  const delBtn = el('button', { class: 'btn secondary small', type: 'button' }, 'Delete') as HTMLButtonElement;
  delBtn.addEventListener('click', () => {
    if (req.id == null) return;
    void removeRequest(req.id).then(() => {
      toast('Request deleted', 'err');
      refresh();
    });
  });
  actions.append(delBtn);

  row.append(actions);
  return row;
}
