import { getMood } from '../data/moods';
import { memoriesOnThisDay } from './memories';

export type RecallPage = { id: string; date: string; title: string; body?: string; mood: string };

export type PalRecall = { entryId: string; line: string };

function daysApart(earlier: string, later: string): number {
  const start = new Date(`${earlier}T00:00:00`);
  const end = new Date(`${later}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function soften(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** A gentle memory. Titles and moods only — never the page body. Not shown every day. */
export function palRecall(entries: RecallPage[], today: string): PalRecall | null {
  const day = Number(today.slice(8, 10));
  if (!Number.isFinite(day) || day % 3 === 0) return null;
  const anniversary = memoriesOnThisDay(entries, today)[0];
  if (anniversary) {
    const title = soften(anniversary.entry.title);
    const mood = getMood(anniversary.entry.mood as 'calm');
    const line = title
      ? `A year ago you wrote about ${title} 🍂`
      : `A year ago you felt ${mood.emoji} ${mood.label}, remember why?`;
    return { entryId: anniversary.entry.id, line };
  }
  const older = entries
    .filter((entry) => entry.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastMonth = older.find((entry) => {
    const gap = daysApart(entry.date, today);
    return gap >= 25 && gap <= 40;
  });
  if (!lastMonth) return null;
  const mood = getMood(lastMonth.mood as 'calm');
  return { entryId: lastMonth.id, line: `Last month you felt ${mood.emoji} ${mood.label}, remember why?` };
}

export function palMayRemember(options: { palOn: boolean; deepWriting: boolean }): boolean {
  return options.palOn && !options.deepWriting;
}
