import { categoryMeta, impactColor, type Impact } from './categories';
import { whoIs } from './explainer';
import { dataFlow, sharingLabel, sharingColor } from '../brokers/flows';

/** One structured, framework-agnostic description of a tracker, rendered by popup + dashboard. */
export interface TrackerDescription {
  categoryLabel: string;
  categoryIcon: string;
  color: string;
  impact: Impact;
  impactColor: string;
  /** Clear, simple line: what this tracker does to you. */
  does: string;
  /** Who the company is, if known. */
  who?: string;
  /** Where your data goes (the L3 flow), if known. */
  flow?: { label: string; color: string; role: string; text: string };
}

export function describeTracker(entity: string, category?: string): TrackerDescription {
  const m = categoryMeta(category);
  const f = dataFlow(entity);
  return {
    categoryLabel: m.label,
    categoryIcon: m.icon,
    color: m.color,
    impact: m.impact,
    impactColor: impactColor(m.impact),
    does: m.doesToYou,
    who: whoIs(entity),
    flow: f
      ? { label: sharingLabel(f.sharing), color: sharingColor(f.sharing), role: f.role, text: f.flow }
      : undefined,
  };
}
