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
    color: '#d9595e',
    icon: 'ads',
    impact: 'High',
    doesToYou: 'Profiles your interests and auctions your attention to advertisers in real time.',
  },
  Analytics: {
    label: 'Analytics',
    color: '#6e9eff',
    icon: 'analytics',
    impact: 'Medium',
    doesToYou: 'Records what you click and how you behave to profile the audience.',
  },
  Social: {
    label: 'Social',
    color: '#9a7cf0',
    icon: 'social',
    impact: 'High',
    doesToYou: 'Links this visit to your social-media identity to target you.',
  },
  'Session replay': {
    label: 'Session replay',
    color: '#d9a23a',
    icon: 'replay',
    impact: 'High',
    doesToYou: 'Can record your mouse moves, clicks, scrolling and sometimes what you type.',
  },
  'Customer data': {
    label: 'Customer data',
    color: '#3fb68b',
    icon: 'customer',
    impact: 'Medium',
    doesToYou: 'Collects your activity into a single customer profile across services.',
  },
  'Tag manager': {
    label: 'Tag manager',
    color: '#8b95a5',
    icon: 'content',
    impact: 'Medium',
    doesToYou: 'Loads other trackers onto the page and hands them what you do.',
  },
  Content: {
    label: 'Content',
    color: '#6b7686',
    icon: 'content',
    impact: 'Low',
    doesToYou: 'Loads embedded content or files; sees your IP and that you are here.',
  },
  Other: {
    label: 'Other',
    color: '#6b7686',
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
