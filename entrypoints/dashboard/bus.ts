/** Lightweight in-page event bus so one section can navigate to another. */
export const bus = new EventTarget();

export function navigate(sectionId: string): void {
  bus.dispatchEvent(new CustomEvent('navigate', { detail: sectionId }));
}
