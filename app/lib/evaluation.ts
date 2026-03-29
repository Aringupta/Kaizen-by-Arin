import type { Habit } from "./types";

/** Returns today's logical date (YYYY-MM-DD). Before 3 AM counts as previous day. */
export function getLogicalDate(): string {
  const now = new Date();
  if (now.getHours() < 3) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}

/** Returns day-of-week (0 = Sun) for the logical date. */
export function getLogicalDow(): number {
  const now = new Date();
  if (now.getHours() < 3) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev.getDay();
  }
  return now.getDay();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00"); // noon avoids DST edge cases
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getDow(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDay();
}

/** Evaluate a single past day: increment streaks for completed habits, reset for missed. */
export function evaluateSingleDay(habits: Habit[], dateStr: string): Habit[] {
  const dow = getDow(dateStr);
  return habits.map((h) => {
    if (!h.activeDays.includes(dow)) return h;
    if (h.completions?.[dateStr]) {
      const newStreak = h.currentStreak + 1;
      return {
        ...h,
        currentStreak: newStreak,
        longestStreak: Math.max(h.longestStreak, newStreak),
      };
    }
    return { ...h, currentStreak: 0 };
  });
}

/**
 * Evaluate all days from (lastEvaluatedDate + 1) to (logicalToday − 1).
 *
 * NOTE: This function only updates streaks. It does NOT create failure records
 * for missed days, because failure records require a user-provided reason
 * (collected via the UI). This means retroactively evaluated missed days will
 * reset streaks but won't appear in failure statistics — a known design
 * tradeoff that may cause under-reporting in failure rate calculations.
 */
export function evaluateMissedDays(
  habits: Habit[],
  lastEvaluatedDate: string | null,
  logicalToday: string,
): { habits: Habit[]; newLastEvaluatedDate: string | null; evaluatedScheduledDays: number } {
  if (!lastEvaluatedDate || lastEvaluatedDate >= logicalToday) {
    return { habits, newLastEvaluatedDate: lastEvaluatedDate, evaluatedScheduledDays: 0 };
  }

  let current = addDays(lastEvaluatedDate, 1);
  let updated = habits;
  let evaluatedScheduledDays = 0;

  while (current < logicalToday) {
    const dow = getDow(current);
    if (updated.some((h) => h.activeDays.includes(dow))) {
      updated = evaluateSingleDay(updated, current);
      evaluatedScheduledDays++;
    }
    current = addDays(current, 1);
  }

  return {
    habits: updated,
    newLastEvaluatedDate: addDays(logicalToday, -1),
    evaluatedScheduledDays,
  };
}
