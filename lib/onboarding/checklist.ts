/** First-run checklist on the dashboard: three steps that each tick themselves off. */

export interface ChecklistInput {
  /** true or false when the browser can tell whether the icon is pinned, null when it can't. */
  pinned: boolean | null;
  visited: boolean;
  popupOpened: boolean;
  /** The user ticked "pinned" by hand (browsers that can't tell). */
  pinConfirmed: boolean;
}

export interface ChecklistStep {
  id: 'pin' | 'visit' | 'popup';
  title: string;
  hint: string;
  done: boolean;
  /** Show a "Done" button, because the browser can't detect this step. */
  manual: boolean;
}

export function checklist(i: ChecklistInput): { steps: ChecklistStep[]; done: boolean } {
  const steps: ChecklistStep[] = [
    {
      id: 'pin',
      title: 'Pin Datawake to your toolbar',
      hint: 'Click the puzzle piece next to the address bar, then the pin next to Datawake.',
      done: i.pinned === true || i.pinConfirmed,
      manual: i.pinned === null,
    },
    {
      id: 'visit',
      title: 'Visit any website',
      hint: 'Datawake rejects the cookie banner for you and starts checking who tracks you.',
      done: i.visited,
      manual: false,
    },
    {
      id: 'popup',
      title: 'Click the Datawake icon',
      hint: 'See which companies are tracking you on that site, right now.',
      done: i.popupOpened,
      manual: false,
    },
  ];
  return { steps, done: steps.every((s) => s.done) };
}
