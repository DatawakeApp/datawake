import { el } from '../dom';
import { openCompanyDetail } from './detail';
import { historyStats, type EntityStat } from '../../../lib/storage/db';
import { dataFlow, sharingColor, type Sharing, type DataFlow } from '../../../lib/brokers/flows';

const GROUPS: { key: Sharing; title: string }[] = [
  { key: 'sells', title: 'Sell or broker your data' },
  { key: 'shares', title: 'Share your data for targeting' },
  { key: 'internal', title: 'Mostly use data internally' },
];

export async function renderFlows(root: HTMLElement): Promise<void> {
  root.replaceChildren(flowsSkeleton());
  const stats = await historyStats(Number.MAX_SAFE_INTEGER);
  const known = stats.entities.filter((e) => e.known);

  const wrap = el('div');
  wrap.append(el('h2', {}, 'Where your data goes'));
  wrap.append(
    el(
      'p',
      { class: 'muted intro' },
      'Based on publicly known industry practices for the companies that have tracked you. Not every company follows these patterns exactly. Treat this as a starting point, not a complete map.',
    ),
  );

  const withFlow: { e: EntityStat; f: DataFlow }[] = [];
  for (const e of known) {
    const f = dataFlow(e.entity);
    if (f) withFlow.push({ e, f });
  }
  const without = known.length - withFlow.length;

  if (!withFlow.length) {
    wrap.append(el('p', { class: 'muted' }, 'Nothing to show yet. Browse a little and come back.'));
    root.replaceChildren(wrap);
    return;
  }

  for (const g of GROUPS) {
    const items = withFlow.filter((x) => x.f.sharing === g.key);
    if (!items.length) continue;
    wrap.append(el('h3', { class: 'flowgroup', style: `color:${sharingColor(g.key)}` }, g.title));
    const list = el('div', { class: 'list' });
    for (const { e, f } of items) {
      const row = el('button', { class: 'flowrow', type: 'button' });
      row.append(
        el('div', { class: 'flowrow-head' }, el('span', { class: 'cname' }, e.entity), el('span', { class: 'muted' }, f.role)),
        el('p', { class: 'muted flowrow-flow' }, f.flow),
      );
      row.addEventListener('click', () => void openCompanyDetail(e.entity, e.category));
      list.append(row);
    }
    wrap.append(list);
  }

  if (without > 0) {
    wrap.append(el('p', { class: 'muted' }, `${without} other tracked companies don't have a data-flow note yet.`));
  }

  root.replaceChildren(wrap);
}

function flowsSkeleton(): HTMLElement {
  const box = el('div', { class: 'stack' });
  for (let g = 0; g < 3; g++) {
    box.append(el('div', { class: 'skeleton', style: 'height:24px;width:220px;border-radius:6px;margin-top:20px' }));
    const list = el('div', { class: 'list', style: 'margin-top:8px' });
    for (let i = 0; i < 3; i++) list.append(el('div', { class: 'skeleton', style: 'height:64px;border-radius:9px' }));
    box.append(list);
  }
  return box;
}
