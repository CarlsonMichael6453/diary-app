import type { MoodId } from '../data/moods';

export const MOOD_SCORE: Record<string, number> = {
  happy: 5,
  loved: 5,
  grateful: 4,
  hopeful: 4,
  excited: 4,
  fired: 5,
  calm: 3,
  tired: 2,
  anxious: 2,
  sad: 1,
  angry: 1,
};

export type StatEntry = {
  date: string;
  mood: string;
  tags?: string[];
  activities?: string[];
};

const GOOD = 4;

function dayOfYear(dateKey: string): { year: number; index: number; leap: boolean } {
  const [yearText, monthText, dayText] = dateKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let index = day - 1;
  for (let i = 0; i < month - 1; i += 1) index += lengths[i];
  return { year, index, leap };
}

export function yearPixels(entries: StatEntry[], year: number): { date: string; mood: string | null }[] {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const total = leap ? 366 : 365;
  const cells: { date: string; mood: string | null }[] = [];
  const byIndex = new Map<number, string>();
  for (const entry of entries) {
    const info = dayOfYear(entry.date);
    if (info.year === year && !byIndex.has(info.index)) byIndex.set(info.index, entry.mood);
  }
  const start = new Date(year, 0, 1);
  for (let i = 0; i < total; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    cells.push({ date: key, mood: byIndex.get(i) ?? null });
  }
  return cells;
}

export function moodCounts(entries: StatEntry[], from: string, to: string): { mood: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.date < from || entry.date > to) continue;
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count || a.mood.localeCompare(b.mood));
}

export function goodDayNotes(entries: StatEntry[]): string[] {
  const scored = entries.filter((entry) => MOOD_SCORE[entry.mood] != null);
  if (scored.length < 2) return [];
  const good = scored.filter((entry) => MOOD_SCORE[entry.mood] >= GOOD);
  if (good.length === 0) return [];
  const labels = new Map<string, { good: number; all: number }>();
  for (const entry of scored) {
    const marks = [...(entry.tags ?? []), ...(entry.activities ?? [])];
    for (const mark of new Set(marks.map((item) => item.trim()).filter(Boolean))) {
      const row = labels.get(mark) ?? { good: 0, all: 0 };
      row.all += 1;
      if (MOOD_SCORE[entry.mood] >= GOOD) row.good += 1;
      labels.set(mark, row);
    }
  }
  const notes: string[] = [];
  for (const [label, row] of labels) {
    if (row.good < 2) continue;
    const goodRate = row.good / good.length;
    const baseRate = row.all / scored.length;
    if (goodRate > baseRate && row.good / row.all >= 0.6) notes.push(`On good days you ${label}`);
  }
  return notes.sort();
}

export function moodScore(mood: string): number {
  return MOOD_SCORE[mood] ?? 3;
}

export type MoodIdCheck = MoodId;
