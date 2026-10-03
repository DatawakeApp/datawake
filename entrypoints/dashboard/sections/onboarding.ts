import { brandMark } from '../../../lib/ui/brand-mark';
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { saveSettings } from '../../../lib/settings';

const FEATURES = [
  {
    icon: 'cookie' as const,
    title: 'Says no for you',
    desc: 'Datawake clicks Reject on cookie banners and sends the Global Privacy Control signal, so you stop handing out consent.',
  },
  {
    icon: 'alert-triangle' as const,
    title: 'Catches sites that ignore it',
    desc: 'It checks whether a site keeps tracking you after you said no, with cookies or by fingerprinting your device, and keeps the evidence.',
  },
  {
    icon: 'scope' as const,
    title: 'Shows who is tracking you',
    desc: 'Every company on the page, what it does, and which ones are sending data right now.',
  },
  {
    icon: 'mail' as const,
    title: 'Helps you act',
    desc: 'Report a site to your data protection authority, or ask a company for a copy of your data.',
  },
] as const;

export async function showOnboarding(onDone: () => void): Promise<void> {
  const overlay = el('div', { class: 'onboard-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Welcome to Datawake' });

  const card = el('div', { class: 'onboard-card' });

  // Header
  const hd = el('div', { class: 'onboard-header' });
  hd.append(brandMark(40, 'onboard-logo'));
  const hTitle = el('h1', { class: 'onboard-title' }, 'Welcome to Datawake');
  const hSub = el('p', { class: 'onboard-sub' }, 'Datawake says no to tracking for you, and catches the sites that don’t listen.');
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

  // The popup is where people see each site; it's hidden until the icon is pinned.
  const tip = el('div', { class: 'onboard-tip' });
  tip.append(icon('star', 16, 'onboard-tip-ic'), el('p', {},
    el('strong', {}, 'Pin Datawake to your toolbar. '),
    'Click the puzzle piece next to the address bar, then the pin next to Datawake, to see what is tracking you on any site with one click.'));
  card.append(tip);

  const cta = el('button', { class: 'onboard-cta', type: 'button' });
  cta.append(el('span', {}, 'Got it, start browsing'), icon('arrow', 18, 'onboard-cta-ic'));
  cta.addEventListener('click', () => void finish());
  card.append(cta);

  const finish = async (): Promise<void> => {
    try {
      await saveSettings({ onboarded: true });
    } finally {
      overlay.remove();
      onDone();
    }
  };

  card.append(el('p', { class: 'onboard-trust' }, 'Everything stays on your device. You can change any of this in Settings.'));

  overlay.append(card);
  document.body.append(overlay);

  // Focus the CTA for keyboard users
  setTimeout(() => cta.focus(), 50);
}
