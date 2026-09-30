import { brandMark } from '../../../lib/ui/brand-mark';
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { getSettings, saveSettings } from '../../../lib/settings';

const FEATURES = [
  {
    icon: 'scope' as const,
    title: 'See who’s tracking you',
    desc: 'Datawake shows every outside company loading on the sites you visit, as it happens.',
  },
  {
    icon: 'shield' as const,
    title: 'Understand your exposure',
    desc: 'Find out which data brokers are profiling you and what ad categories they’ve placed you in.',
  },
  {
    icon: 'analytics' as const,
    title: 'Privacy score per site',
    desc: 'Every site gets a grade from A to F. See at a glance how invasive a site’s tracking is.',
  },
  {
    icon: 'content' as const,
    title: 'Cookie summary + GPC',
    desc: 'Instantly see what cookies a site sets. Global Privacy Control is sent automatically.',
  },
] as const;

export async function showOnboarding(onDone: () => void): Promise<void> {
  const settings = await getSettings();

  const overlay = el('div', { class: 'onboard-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Welcome to Datawake' });

  const card = el('div', { class: 'onboard-card' });

  // Header
  const hd = el('div', { class: 'onboard-header' });
  hd.append(brandMark(40, 'onboard-logo'));
  const hTitle = el('h1', { class: 'onboard-title' }, 'Welcome to Datawake');
  const hSub = el('p', { class: 'onboard-sub' }, 'You deserve to know who’s watching you online.');
  hd.append(hTitle, hSub);
  card.append(hd);

  // Feature grid
  const grid = el('div', { class: 'onboard-grid' });
  for (const f of FEATURES) {
    const tile = el('div', { class: 'onboard-tile' });
    tile.append(icon(f.icon, 22, 'onboard-tile-ic'));
    tile.append(el('p', { class: 'onboard-tile-title' }, f.title));
    tile.append(el('p', { class: 'onboard-tile-desc' }, f.desc));
    grid.append(tile);
  }
  card.append(grid);

  // Optional name field
  const nameSection = el('div', { class: 'onboard-name-section' });
  const nameLabel = el('label', { class: 'onboard-name-label', for: 'ob-name' });
  nameLabel.textContent = 'Your name ';
  nameLabel.append(el('span', { class: 'onboard-optional' }, '(optional, used for GDPR removal requests)'));
  const nameInput = el('input', {
    id: 'ob-name',
    type: 'text',
    class: 'onboard-name-input',
    placeholder: 'Jane Smith',
    value: settings.name,
    autocomplete: 'name',
  }) as HTMLInputElement;
  nameSection.append(nameLabel, nameInput);
  card.append(nameSection);

  // CTA
  const cta = el('button', { class: 'onboard-cta', type: 'button' });
  cta.append(el('span', {}, 'Start protecting my privacy'), icon('arrow', 18, 'onboard-cta-ic'));
  cta.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    await saveSettings({ onboarded: true, ...(name ? { name } : {}) });
    overlay.remove();
    onDone();
  });
  card.append(cta);

  // Footer trust + skip
  const footer = el('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px' });
  footer.append(el('p', { class: 'onboard-trust', style: 'margin:0' }, 'Nothing leaves your device'));
  const skipBtn = el('button', { type: 'button', style: 'background:none;border:none;color:var(--muted);font:inherit;font-size:12px;cursor:pointer;padding:0;text-decoration:underline' }, 'Skip for now');
  skipBtn.addEventListener('click', async () => {
    await saveSettings({ onboarded: true });
    overlay.remove();
    onDone();
  });
  footer.append(skipBtn);
  card.append(footer);

  overlay.append(card);
  document.body.append(overlay);

  // Focus the CTA for keyboard users
  setTimeout(() => cta.focus(), 50);
}
