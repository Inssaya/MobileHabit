const DAY_MS = 24 * 60 * 60 * 1000;

// Plain (non-reactive) helpers for time-based numbers. These must be computed
// at render time from raw store fields, never wrapped in a zustand selector
// themselves — a selector that returns a fresh Date.now()-derived value on
// every call never satisfies useSyncExternalStore's snapshot-stability check
// and causes an infinite render loop ("Maximum update depth exceeded").

export function computeCurrentStreakDays(streakStartedAt: number | null, now: number = Date.now()): number {
  if (!streakStartedAt) return 0;
  return Math.max(0, (now - streakStartedAt) / DAY_MS);
}

export function computeTotalCleanDays(
  lifetimeCleanDaysBanked: number,
  streakStartedAt: number | null,
  now: number = Date.now()
): number {
  return lifetimeCleanDaysBanked + computeCurrentStreakDays(streakStartedAt, now);
}

export function computeTotalScore(
  lifetimeCleanDaysBanked: number,
  streakStartedAt: number | null,
  resistedCount: number,
  now: number = Date.now()
): number {
  return Math.round(computeTotalCleanDays(lifetimeCleanDaysBanked, streakStartedAt, now) * 10) + resistedCount * 15;
}
