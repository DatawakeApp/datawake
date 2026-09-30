/** Shared category metadata so popup + dashboard read and look consistent. */
export type Impact = 'High' | 'Medium' | 'Low';

export interface CategoryMeta {
  label: string;
  color: string;
  /** Icon name from entrypoints/icons.ts. */
  icon: string;
  /** Clear, simple, effective one-liner: what this kind of tracking does to you. */
  doesToYou: string;
  /** How intrusive this technique typically is. */
  impact: Impact;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  Advertising: {
    label: 'Advertising',
    color: '#f1707a',
    icon: 'ads',
    impact: 'High',
    doesToYou: 'Profiles your interests and auctions your attention to advertisers in real time.',
  },
  Analytics: {
    label: 'Analytics',
    color: '#6aa6ff',
    icon: 'analytics',
    impact: 'Medium',
    doesToYou: 'Records what you click and how you behave to profile the audience.',
  },
  Social: {
    label: 'Social',
    color: '#b08cff',
    icon: 'social',
    impact: 'High',
    doesToYou: 'Links this visit to your social-media identity to target you.',
  },
  'Session replay': {
    label: 'Session replay',
    color: '#ffb066',
    icon: 'replay',
    impact: 'High',
    doesToYou: 'Can record your mouse moves, clicks, scrolling and sometimes what you type.',
  },
  'Customer data': {
    label: 'Customer data',
    color: '#4dd4b0',
    icon: 'customer',
    impact: 'Medium',
    doesToYou: 'Collects your activity into a single customer profile across services.',
  },
  Content: {
    label: 'Content',
    color: '#8a94a6',
    icon: 'content',
    impact: 'Low',
    doesToYou: 'Loads embedded content or files; sees your IP and that you are here.',
  },
  Other: {
    label: 'Other',
    color: '#8a94a6',
    icon: 'content',
    impact: 'Low',
    doesToYou: 'A third-party connection that can see you visited this page.',
  },
};

export function categoryMeta(category?: string): CategoryMeta {
  return CATEGORY_META[category ?? 'Other'] ?? CATEGORY_META.Other;
}

export function categoryColor(category?: string): string {
  return categoryMeta(category).color;
}

export function categoryIcon(category?: string): string {
  return categoryMeta(category).icon;
}

export function categoryDoes(category?: string): string {
  return categoryMeta(category).doesToYou;
}

const IMPACT_COLOR: Record<Impact, string> = {
  High: '#f1707a',
  Medium: '#ffb066',
  Low: '#8a94a6',
};

export function impactColor(impact: Impact): string {
  return IMPACT_COLOR[impact];
}
