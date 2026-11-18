import { addDays, todayKey } from './dates';

export function writingStreak(dates: Iterable<string>, today = todayKey()): number {
  const days = new Set(dates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function loginProgress(lastDate: string | null, streak: number, today: string): {
  claimed: boolean;
  nextStreak: number;
  dayIndex: number;
} {
  if (lastDate === today) {
    const safe = Math.max(1, streak);
    return { claimed: true, nextStreak: safe, dayIndex: (safe - 1) % 7 };
  }
  const nextStreak = lastDate === addDays(today, -1) ? streak + 1 : 1;
  return { claimed: false, nextStreak, dayIndex: (nextStreak - 1) % 7 };
}
