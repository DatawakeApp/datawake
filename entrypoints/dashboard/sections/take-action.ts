/** Take action: GDPR requests, the email breach check, and each platform's own ad settings. */
import { el } from '../dom';
import { icon } from '../../../lib/ui/icons';
import { widget } from '../widgets';
import { renderRequests } from './requests';
import { buildBreachWidget } from './breach';

const PLATFORMS = [
  { name: 'Google', desc: 'See and edit the interests Google uses to target ads at you', url: 'https://adssettings.google.com' },
  { name: 'Facebook / Meta', desc: 'See the categories Meta uses for ads on Facebook and Instagram', url: 'https://www.facebook.com/ads/preferences' },
  { name: 'LinkedIn', desc: 'Review what LinkedIn uses for sponsored content', url: 'https://www.linkedin.com/psettings/advertising-data' },
  { name: 'TikTok', desc: 'Check which interests TikTok has assigned to you', url: 'https://www.tiktok.com/setting/interest-to-ads' },
  { name: 'X', desc: 'See the demographics and interests X infers for ads', url: 'https://twitter.com/settings/your_twitter_data/twitter_interests' },
] as const;

export async function renderTakeAction(root: HTMLElement): Promise<void> {
  const requests = el('div');
  const wrap = el('div', { class: 'stack' },
    el('p', { class: 'muted intro' }, 'Ask companies what they hold on you, check whether your email leaked, and turn off ad targeting where the platforms let you.'),
    requests,
    buildBreachWidget(),
    platformLinks(),
  );
  root.replaceChildren(wrap);
  await renderRequests(requests);
}

function platformLinks(): HTMLElement {
  const list = el('div', { class: 'plat-list' });
  for (const p of PLATFORMS) {
    const link = el('a', { class: 'plat-link', href: p.url, target: '_blank', rel: 'noopener noreferrer' }, 'Open settings');
    link.append(icon('external', 11));
    list.append(el('div', { class: 'plat-row' },
      el('div', { class: 'plat-text' }, el('div', { class: 'plat-name' }, p.name), el('div', { class: 'plat-desc' }, p.desc)),
      link,
    ));
  }
  return widget('Your ad settings on each platform', list);
}
