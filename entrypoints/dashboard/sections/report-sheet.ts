/** "Report this site": a ready complaint to the user's data protection authority. */
import { el, toast } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { openOverlay } from '../overlay';
import { getSettings, saveSettings } from '../../../lib/settings';
import { AUTHORITIES, FIND_AUTHORITY_URL, authorityFor, guessCountry } from '../../../lib/complaint/authorities';
import { buildComplaint, evidenceFile, type ViolationEvidence } from '../../../lib/complaint/complaint';

export async function openReportSheet(v: ViolationEvidence): Promise<void> {
  const settings = await getSettings();
  let country = settings.country || guessCountry(navigator.languages ?? []) || '';

  const wrap = el('div', { class: 'report-sheet' });
  wrap.append(
    el('h3', { class: 'sheet-title' }, `Report ${v.site}`),
    el('p', { class: 'muted' }, 'You can complain, for free, to the data protection authority where you live. Datawake wrote the complaint from what it recorded. Read it, change anything you like, then send it through the authority\'s website.'),
  );

  const select = el('select', { 'aria-label': 'Where you live' }) as HTMLSelectElement;
  select.append(el('option', { value: '' }, 'Choose where you live'));
  for (const a of [...AUTHORITIES].sort((x, y) => x.countryName.localeCompare(y.countryName))) {
    select.append(el('option', { value: a.country, selected: a.country === country }, a.countryName));
  }
  select.append(el('option', { value: 'other', selected: country === 'other' }, 'Another country'));

  const text = el('textarea', { class: 'report-text', rows: 16, 'aria-label': 'Complaint text', spellcheck: false }) as HTMLTextAreaElement;
  const actions = el('div', { class: 'report-actions' });
  const note = el('p', { class: 'muted report-note' });

  const draw = (): void => {
    const authority = authorityFor(country);
    const complaint = authority ? buildComplaint(v, authority, settings) : null;
    text.hidden = !complaint;
    if (complaint) text.value = `${complaint.subject}\n\n${complaint.body}`;

    const copy = el('button', { class: 'btn', type: 'button' }, icon('content', 14), 'Copy complaint') as HTMLButtonElement;
    copy.addEventListener('click', () => {
      void navigator.clipboard.writeText(text.value).then(() => toast('Complaint copied'), () => toast('Could not copy. Select the text and copy it.', 'err'));
    });
    const save = el('button', { class: 'btn secondary', type: 'button' }, 'Download evidence') as HTMLButtonElement;
    save.addEventListener('click', () => download(evidenceFile(v), `datawake-evidence-${v.site.replace(/[^a-z0-9]+/gi, '-')}.json`));
    const open = el('a', { class: 'btn secondary', href: authority?.url ?? FIND_AUTHORITY_URL, target: '_blank', rel: 'noopener noreferrer' },
      authority ? 'Open the authority\'s website' : 'Find your authority');
    open.append(icon('external', 12));

    actions.replaceChildren(...(complaint ? [copy, save] : []), ...(country ? [open] : []));
    note.textContent = !country
      ? 'Choose where you live to get the right authority.'
      : authority
        ? `Your complaint goes to ${authority.name}. Some authorities ask you to contact the website first, or to write in their language.`
        : 'Find your country\'s authority on the European Data Protection Board\'s list. You can still download the evidence.';
    if (!authority && country) actions.prepend(save);
  };

  select.addEventListener('change', () => {
    country = select.value;
    void saveSettings({ country }).catch(() => undefined);
    draw();
  });

  wrap.append(el('label', { class: 'report-label' }, 'Where you live', select), note, text, actions);
  draw();
  openOverlay(wrap);
}

function download(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const a = el('a', { href: url, download: filename }) as HTMLAnchorElement;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
