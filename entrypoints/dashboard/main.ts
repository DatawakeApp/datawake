import { brandMark } from '../../lib/ui/brand-mark';
import { el } from './dom';
import { icon } from '../../lib/ui/icons';
import { renderOverview } from './sections/overview';
import { renderReport } from './sections/report';
import { renderFootprint } from './sections/footprint';
import { renderFlows } from './sections/flows';
import { renderRequests } from './sections/requests';
import { renderSettings } from './sections/settings';
import { renderProfile } from './sections/profile';
import { renderExposure } from './sections/exposure';
import { renderViolations } from './sections/violations';
import { closeOverlay } from './sections/detail';
import { bus } from './bus';
import { showOnboarding } from './sections/onboarding';
import { getSettings } from '../../lib/settings';

interface Section {
  id: string;
  label: string;
  icon: string;
  render: (root: HTMLElement) => void | Promise<void>;
}

const sections: Section[] = [
  { id: 'overview', label: 'Overview', icon: 'grid', render: renderOverview },
  { id: 'violations', label: 'Violations', icon: 'alert-triangle', render: renderViolations },
  { id: 'report', label: 'Activity', icon: 'clock', render: renderReport },
  { id: 'footprint', label: 'Footprint', icon: 'user', render: renderFootprint },
  { id: 'flows', label: 'Where your data goes', icon: 'share', render: renderFlows },
  { id: 'profile', label: 'Browsing profile', icon: 'ads', render: renderProfile },
  { id: 'exposure', label: 'Exposure', icon: 'shield', render: renderExposure },
  { id: 'requests', label: 'GDPR Requests', icon: 'gpc', render: renderRequests },
  { id: 'settings', label: 'Settings', icon: 'settings', render: renderSettings },
];

const nav = document.getElementById('nav') as HTMLElement;
const page = document.getElementById('page') as HTMLElement;
const title = document.getElementById('page-title') as HTMLElement;
const sidebar = document.getElementById('sidebar') as HTMLElement;

const brand = document.querySelector('.brand') as HTMLElement;
brand.append(brandMark(28), el('span', { class: 'brand-name' }, 'Datawake'));

const menu = document.getElementById('menu') as HTMLElement;
menu.append(icon('menu', 20));
menu.addEventListener('click', () => sidebar.classList.toggle('open'));

const navGroups: { label?: string; ids: string[] }[] = [
  { ids: ['overview', 'violations'] },
  { label: 'Data', ids: ['report', 'footprint', 'flows'] },
  { label: 'Privacy', ids: ['profile', 'exposure', 'requests'] },
  { label: 'Account', ids: ['settings'] },
];

for (const group of navGroups) {
  if (group.label) {
    nav.append(el('span', { class: 'side-group-label' }, group.label));
  }
  for (const id of group.ids) {
    const s = sections.find((sec) => sec.id === id);
    if (!s) continue;
    const b = el('button', { class: 'side-item', 'data-id': s.id });
    b.append(icon(s.icon, 16), el('span', { class: 'side-label' }, s.label));
    b.addEventListener('click', () => {
      show(s.id);
      sidebar.classList.remove('open');
    });
    nav.append(b);
  }
}

function show(id: string): void {
  const section = sections.find((s) => s.id === id) ?? sections[0];
  closeOverlay();
  for (const b of Array.from(nav.querySelectorAll('button'))) {
    const active = (b as HTMLElement).dataset.id === section.id;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  title.textContent = section.label;
  location.hash = section.id;
  page.replaceChildren();
  page.scrollTo?.(0, 0);
  void section.render(page);
}

bus.addEventListener('navigate', (e) => show((e as CustomEvent<string>).detail));

const initial = sections.find((s) => s.id === location.hash.slice(1))?.id ?? 'overview';
getSettings().then((s) => {
  if (!s.onboarded) {
    void showOnboarding(() => show(initial));
  } else {
    show(initial);
  }
}).catch(() => show(initial));
