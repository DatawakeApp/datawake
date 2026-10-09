import { el, toast } from '../dom';
import { getSettings, saveSettings } from '../../../lib/settings';
import { clearAllData, exportAll } from '../../../lib/storage/db';
import { WALL_SITES_KEY, removeWallSite } from '../../../lib/cmp/disguised-wall';
import { RADAR_VERSION, RADAR_TRACKER_COUNT } from '../../../lib/trackers/radar';

export async function renderSettings(root: HTMLElement): Promise<void> {
  const draw = async (): Promise<void> => {
    const s = await getSettings();
    const wrap = el('div');

    // ── Privacy protection ──
    wrap.append(el('h2', {}, 'Protection'));
    wrap.append(el('p', { class: 'muted' }, 'These run automatically on every page you visit.'));

    const settingsBlock = el('div', { class: 'settings-block' });

    // Auto-reject toggle
    const arRow = el('div', { class: 'settings-row' });
    const arLeft = el('div', { class: 'settings-row-left' });
    arLeft.append(el('span', { class: 'settings-row-title' }, 'Say no to cookie banners for me'));
    arLeft.append(el('span', { class: 'settings-row-desc' }, 'When a site asks to track you, Datawake says no for you, then checks that the site listens. If saying no means paying for a subscription, Datawake leaves the choice to you.'));
    const arLabel = el('label', { class: 'toggle toggle-right' });
    const arInput = el('input', { type: 'checkbox' }) as HTMLInputElement;
    arInput.checked = s.autoRejectEnabled !== false;
    arInput.addEventListener('change', () => void saveSettings({ autoRejectEnabled: arInput.checked }));
    arLabel.append(arInput, el('span', {}));
    arRow.append(arLeft, arLabel);
    settingsBlock.append(arRow);

    // GPC toggle
    const gpcRow = el('div', { class: 'settings-row settings-row-bordered' });
    const gpcLeft = el('div', { class: 'settings-row-left' });
    gpcLeft.append(el('span', { class: 'settings-row-title' }, 'Send "do not sell my data"'));
    gpcLeft.append(el('span', { class: 'settings-row-desc' }, 'Tells every site you visit not to sell or share your data (Global Privacy Control). In some places, like California, sites must respect it.'));
    const gpcLabel = el('label', { class: 'toggle toggle-right' });
    const gpcInput = el('input', { type: 'checkbox' }) as HTMLInputElement;
    gpcInput.checked = s.gpcEnabled !== false;
    gpcInput.addEventListener('change', () => void saveSettings({ gpcEnabled: gpcInput.checked }));
    gpcLabel.append(gpcInput, el('span', {}));
    gpcRow.append(gpcLeft, gpcLabel);
    settingsBlock.append(gpcRow);

    // Fingerprint protection (off by default)
    settingsBlock.append(toggleRow(
      'Protect against fingerprinting',
      'Adds tiny, invisible changes to what fingerprinting scripts read from your browser (drawings and sound), so the fingerprint is different on every site and can\'t follow you. Datawake still shows who tries. Takes effect on pages you open next. A few sites may ask you to prove you\'re human more often.',
      s.fpProtection,
      async (on) => { await saveSettings({ fpProtection: on }); return on; },
    ));

    // Notifications (asks the browser's permission when turned on)
    settingsBlock.append(toggleRow(
      'Notify me when a site ignores my no',
      'Shows a notification the moment a site keeps tracking you after Datawake rejected cookies.',
      s.notifyViolations,
      async (on) => {
        if (on && !(await browser.permissions.request({ permissions: ['notifications'] }))) return false;
        await saveSettings({ notifyViolations: on });
        return on;
      },
    ));

    // Pause everywhere (same switch style as the rest)
    const pauseRow = el('div', { class: 'settings-row settings-row-bordered' });
    const pauseLeft = el('div', { class: 'settings-row-left' });
    pauseLeft.append(el('span', { class: 'settings-row-title' }, 'Pause Datawake everywhere'));
    pauseLeft.append(el('span', { class: 'settings-row-desc' }, 'Stops detection and protection on every site until you turn it back on.'));
    const pauseLabel = el('label', { class: 'toggle toggle-right' });
    const pause = el('input', { type: 'checkbox' }) as HTMLInputElement;
    pause.checked = s.paused;
    pause.addEventListener('change', () => void saveSettings({ paused: pause.checked }));
    pauseLabel.append(pause, el('span', {}));
    pauseRow.append(pauseLeft, pauseLabel);
    settingsBlock.append(pauseRow);

    wrap.append(settingsBlock);

    // ── Ignored sites ──
    wrap.append(el('h2', {}, 'Ignored sites'));
    wrap.append(el('p', { class: 'muted' }, 'Datawake won\'t record tracking on these sites. Use the "Pause" button in the popup to add sites.'));
    const pausedSites = s.pausedSites ?? [];
    if (pausedSites.length) {
      const siteList = el('div', { class: 'list' });
      for (const site of pausedSites) {
        const row = el('div', { class: 'siterow' });
        row.append(el('span', { class: 'sitename' }, site));
        const rmBtn = el('button', { class: 'btn secondary small', type: 'button', textContent: 'Remove' });
        rmBtn.addEventListener('click', () => {
          void saveSettings({ pausedSites: pausedSites.filter((x) => x !== site) }).then(draw);
        });
        const actions = el('div', { class: 'reqactions' });
        actions.append(rmBtn);
        row.append(actions);
        siteList.append(row);
      }
      wrap.append(siteList);
    } else {
      wrap.append(el('p', { class: 'muted' }, 'None yet.'));
    }

    // ── Sites where the user turned off rejecting ──
    if (s.noRejectSites.length) {
      wrap.append(el('h2', {}, "Sites where Datawake doesn't reject"));
      wrap.append(el('p', { class: 'muted' }, 'You chose to handle cookie banners yourself on these sites. Datawake still shows who tracks you there.'));
      const list = el('div', { class: 'list' });
      for (const site of s.noRejectSites) {
        const btn = el('button', { class: 'btn secondary small', type: 'button', textContent: 'Reject again' });
        btn.addEventListener('click', () => {
          void saveSettings({ noRejectSites: s.noRejectSites.filter((x) => x !== site) }).then(draw).catch(() => toast('Could not update the list', 'err'));
        });
        list.append(el('div', { class: 'siterow' }, el('span', { class: 'sitename' }, site), el('div', { class: 'reqactions' }, btn)));
      }
      wrap.append(list);
    }

    // ── Sites remembered as disguised pay walls ──
    const walls = await loadWallSites();
    if (walls.length) {
      wrap.append(el('h2', {}, 'Sites where you have to pay to refuse'));
      wrap.append(el('p', { class: 'muted' }, 'When rejecting on these sites sent you to a subscription page, Datawake stopped rejecting there and leaves the choice to you. Forget a site to let Datawake reject for you again.'));
      const wallList = el('div', { class: 'list' });
      for (const site of walls) {
        const forget = el('button', { class: 'btn secondary small', type: 'button', textContent: 'Forget' });
        forget.addEventListener('click', () => {
          void browser.storage.local.set({ [WALL_SITES_KEY]: removeWallSite(walls, site) })
            .then(draw)
            .catch(() => toast('Could not update the list', 'err'));
        });
        wallList.append(el('div', { class: 'siterow' }, el('span', { class: 'sitename' }, site), el('div', { class: 'reqactions' }, forget)));
      }
      wrap.append(wallList);
    }

    // ── Identity (used for GDPR letters) ──
    wrap.append(el('h2', {}, 'Your details for GDPR letters'));
    wrap.append(el('p', { class: 'muted' }, 'Only used to fill in data-access and erasure letters. Never sent anywhere; it stays on this device.'));

    const idBlock = el('div', { class: 'settings-block' });

    const nameRow = el('div', { class: 'settings-row' });
    const nameLeft = el('div', { class: 'settings-row-left' });
    nameLeft.append(el('span', { class: 'settings-row-title' }, 'Full name'));
    nameLeft.append(el('span', { class: 'settings-row-desc' }, 'Used as the signatory on GDPR letters.'));
    const nameInput = el('input', { type: 'text', placeholder: 'Jane Smith', value: s.name, autocomplete: 'name', style: 'width:200px' }) as HTMLInputElement;
    nameInput.addEventListener('change', () => void saveSettings({ name: nameInput.value.trim() }).then(() => toast('Saved')));
    nameRow.append(nameLeft, nameInput);
    idBlock.append(nameRow);

    const emailRow = el('div', { class: 'settings-row settings-row-bordered' });
    const emailLeft = el('div', { class: 'settings-row-left' });
    emailLeft.append(el('span', { class: 'settings-row-title' }, 'Email address'));
    emailLeft.append(el('span', { class: 'settings-row-desc' }, 'Included in letters so companies can verify your identity.'));
    const emailInput = el('input', { type: 'email', placeholder: 'you@example.com', value: s.email, autocomplete: 'email', style: 'width:200px' }) as HTMLInputElement;
    emailInput.addEventListener('change', () => void saveSettings({ email: emailInput.value.trim() }).then(() => toast('Saved')));
    emailRow.append(emailLeft, emailInput);
    idBlock.append(emailRow);

    const addrRow = el('div', { class: 'settings-row settings-row-bordered' });
    const addrLeft = el('div', { class: 'settings-row-left' });
    addrLeft.append(el('span', { class: 'settings-row-title' }, 'Postal address'));
    addrLeft.append(el('span', { class: 'settings-row-desc' }, 'Optional. Some companies ask for a postal address before deleting your data.'));
    const addrInput = el('input', { type: 'text', placeholder: '123 Street, City, Country', value: s.address, style: 'width:200px' }) as HTMLInputElement;
    addrInput.addEventListener('change', () => void saveSettings({ address: addrInput.value.trim() }).then(() => toast('Saved')));
    addrRow.append(addrLeft, addrInput);
    idBlock.append(addrRow);

    wrap.append(idBlock);

    // ── Data ──
    wrap.append(el('h2', {}, 'Data'));
    wrap.append(
      el('p', { class: 'muted' }, `Recognising ${RADAR_TRACKER_COUNT.toLocaleString()} trackers (dataset built ${RADAR_VERSION}). Everything Datawake records stays on this device.`),
    );

    const exportJsonBtn = el('button', { class: 'btn secondary', type: 'button', textContent: 'Export as JSON' }) as HTMLButtonElement;
    exportJsonBtn.addEventListener('click', async () => {
      exportJsonBtn.disabled = true;
      exportJsonBtn.textContent = 'Exporting…';
      try {
        const data = await exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        download(blob, `datawake-export-${today()}.json`);
        toast('Exported as JSON');
      } finally {
        exportJsonBtn.disabled = false;
        exportJsonBtn.textContent = 'Export as JSON';
      }
    });

    const exportCsvBtn = el('button', { class: 'btn secondary', type: 'button', textContent: 'Export as CSV' }) as HTMLButtonElement;
    exportCsvBtn.addEventListener('click', async () => {
      exportCsvBtn.disabled = true;
      exportCsvBtn.textContent = 'Exporting…';
      try {
        const data = await exportAll();
        const header = ['date', 'site', 'company', 'category', 'tracker_domain'].join(',');
        const rows = data.events.map((e) =>
          [new Date(e.ts).toISOString().slice(0, 10), e.site, e.entity, e.category ?? '', e.trackerDomain]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        );
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        download(blob, `datawake-export-${today()}.csv`);
        toast('Exported as CSV');
      } finally {
        exportCsvBtn.disabled = false;
        exportCsvBtn.textContent = 'Export as CSV';
      }
    });

    const clearBtn = el('button', { class: 'btn danger', type: 'button', textContent: 'Clear all data' }) as HTMLButtonElement;
    clearBtn.addEventListener('click', () => {
      // Replace with inline confirm to avoid native confirm() dialog
      const bar = el('div', { style: 'display:flex;align-items:center;gap:10px;flex-wrap:wrap' });
      const msg = el('span', { style: 'font-size:13.5px;color:var(--text-2)' }, 'Delete all history and accounts? This cannot be undone.');
      const confirmBtn = el('button', { class: 'btn danger small', type: 'button' }, 'Yes, delete everything') as HTMLButtonElement;
      const cancelBtn = el('button', { class: 'btn secondary small', type: 'button' }, 'Cancel');
      confirmBtn.addEventListener('click', () => {
        confirmBtn.disabled = true;
        void clearAllData().then(() => {
          toast('All data cleared', 'ok');
          void draw();
        });
      });
      cancelBtn.addEventListener('click', () => void draw());
      bar.append(msg, confirmBtn, cancelBtn);
      clearBtn.replaceWith(bar);
    });

    wrap.append(el('div', { class: 'reqbar' }, exportJsonBtn, exportCsvBtn, clearBtn));

    root.replaceChildren(wrap);
  };

  await draw();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadWallSites(): Promise<string[]> {
  try {
    const stored = await browser.storage.local.get(WALL_SITES_KEY);
    const list = stored[WALL_SITES_KEY];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** A settings switch. `onChange` returns the state that actually took effect (e.g. permission refused). */
function toggleRow(title: string, desc: string, checked: boolean, onChange: (on: boolean) => Promise<boolean>): HTMLElement {
  const row = el('div', { class: 'settings-row settings-row-bordered' });
  const left = el('div', { class: 'settings-row-left' });
  left.append(el('span', { class: 'settings-row-title' }, title), el('span', { class: 'settings-row-desc' }, desc));
  const label = el('label', { class: 'toggle toggle-right' });
  const input = el('input', { type: 'checkbox', 'aria-label': title }) as HTMLInputElement;
  input.checked = checked;
  input.addEventListener('change', () => {
    void onChange(input.checked)
      .then((applied) => { input.checked = applied; })
      .catch(() => { input.checked = !input.checked; toast('Could not change this setting', 'err'); });
  });
  label.append(input, el('span', {}));
  row.append(left, label);
  return row;
}
