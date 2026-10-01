/**
 * Toolbar badge: the tracker count in a neutral colour, red only when the site tracked or
 * fingerprinted you after you said no. That way red always means "caught".
 */
export const BADGE_NEUTRAL = '#5a6372';
export const BADGE_ALERT = '#e5484d';
const MAX_COUNT = 99;

export interface BadgeInput {
  trackers: number;
  caughtAfterReject: boolean;
}

export function badgeFor({ trackers, caughtAfterReject }: BadgeInput): { text: string; color: string } {
  const count = trackers > MAX_COUNT ? `${MAX_COUNT}+` : trackers > 0 ? String(trackers) : '';
  if (caughtAfterReject) return { text: count || '!', color: BADGE_ALERT };
  return { text: count, color: BADGE_NEUTRAL };
}
