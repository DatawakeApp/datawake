import { brandMark } from '../../lib/ui/brand-mark';
import { el } from './dom';
import { icon } from '../../lib/ui/icons';
import { renderOverview } from './sections/overview';
import { renderSites } from './sections/sites';
import { renderCompanies } from './sections/companies';
import { renderTakeAction } from './sections/take-action';
import { renderSettings } from './sections/settings';
import { renderProfile } from './sections/profile';
import { renderViolations } from './sections/violations';
import { closeOverlay } from './sections/detail';
import { bus } from './bus';
import { showOnboarding } from './sections/onboarding';
import { getSettings } from '../../lib/settings';

interface Section {
  id: string;
  label: string;
  icon: string;
  /** `arg` is an optional filter from the URL hash, e.g. #companies:sells. */
  render: (root: HTMLElement, arg?: string) => void | Promise<void>;
}

const sections: Section[] = [
  { id: 'overview', label: 'Overview', icon: 'grid', render: renderOverview },
  { id: 'violations', label: 'Violations', icon: 'alert-triangle', render: (root, arg) => renderViolations(root, arg) },
  { id: 'sites', label: 'Sites', icon: 'scope', render: (root, arg) => renderSites(root, arg as never) },
  { id: 'companies', label: 'Companies', icon: 'share', render: (root, arg) => renderCompanies(root, arg as never) },
  { id: 'profile', label: 'Your profile', icon: 'user', render: renderProfile },
  { id: 'action', label: 'Take action', icon: 'mail', render: renderTakeAction },
  { id: 'settings', label: 'Settings', icon: 'settings', render: renderSettings },
];

/** Older section links keep working. */
const ALIASES: Record<string, string> = {
  report: 'sites',
  footprint: 'companies',
  flows: 'companies:sells',
  exposure: 'companies:sells',
  requests: 'action',
};

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
  { label: 'Your data', ids: ['sites', 'companies', 'profile'] },
  { ids: ['action', 'settings'] },
];

navGroups.forEach((group, i) => {
  if (group.label) nav.append(el('span', { class: 'side-group-label' }, group.label));
  else if (i > 0) nav.append(el('span', { class: 'side-gap', 'aria-hidden': 'true' }));
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
});

function show(target: string): void {
  const [rawId, arg] = (ALIASES[target] ?? target).split(':');
  const section = sections.find((s) => s.id === (ALIASES[rawId] ?? rawId)) ?? sections[0];
  closeOverlay();
  for (const b of Array.from(nav.querySelectorAll('button'))) {
    const active = (b as HTMLElement).dataset.id === section.id;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  title.textContent = section.label;
  location.hash = arg ? `${section.id}:${arg}` : section.id;
  page.replaceChildren();
  page.scrollTo?.(0, 0);
  void section.render(page, arg);
}

bus.addEventListener('navigate', (e) => show((e as CustomEvent<string>).detail));

const initial = location.hash.slice(1) || 'overview';
getSettings().then((s) => {
  if (!s.onboarded) {
    void showOnboarding(() => show(initial));
  } else {
    show(initial);
  }
}).catch(() => show(initial));
