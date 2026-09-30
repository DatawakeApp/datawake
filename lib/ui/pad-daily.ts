/**
 * Fill a sparse per-day series so a chart always spans the full window. History only has rows for
 * days with activity; plotting just those turns three days of browsing into a single spike.
 * Days are UTC ISO dates (YYYY-MM-DD), matching how historyStats() keys them.
 */
export interface DayCount {
  day: string;
  count: number;
}

const DAY_MS = 86_400_000;

export function padDaily(daily: readonly DayCount[], days: number, now = Date.now()): DayCount[] {
  const counts = new Map(daily.map((d) => [d.day, d.count]));
  const out: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    out.push({ day, count: counts.get(day) ?? 0 });
  }
  return out;
}
