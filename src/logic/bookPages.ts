import { addDays } from './dates';

export type PageSpot = { id: string; date: string; createdAt: number };

/** A stop in the book. A blank day has no saved entry yet. */
export type PageStop =
  | { kind: 'entry'; id: string; date: string; createdAt: number }
  | { kind: 'blank'; date: string };

/** Pages in reading order: older first, then the time they were created. */
export function orderedPages<T extends PageSpot>(pages: T[]): T[] {
  return [...pages].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

function earliest(dates: string[]): string {
  return dates.reduce((min, date) => (date < min ? date : min));
}

function latest(dates: string[]): string {
  return dates.reduce((max, date) => (date > max ? date : max));
}

/** Inclusive calendar days. Capped so a broken date cannot loop forever. */
export function daysFrom(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  for (let guard = 0; guard < 4000 && cursor <= end; guard += 1) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/**
 * The book a thumb can walk. Saved pages stay in order. Days with nothing
 * written are blank pages, including the gaps between entries. One fresh
 * blank day always sits after the last page, so a forward swipe can open it.
 */
export function pageTrail(saved: PageSpot[], current: PageSpot, today: string): PageStop[] {
  const ordered = orderedPages(saved);
  const currentSaved = ordered.some((page) => page.id === current.id);
  const known = [current.date, today, ...ordered.map((page) => page.date)];
  const start = earliest(known);
  const end = addDays(latest(known), 1);
  const byDate = new Map<string, PageSpot[]>();
  for (const page of ordered) {
    const list = byDate.get(page.date) ?? [];
    list.push(page);
    byDate.set(page.date, list);
  }
  const stops: PageStop[] = [];
  for (const date of daysFrom(start, end)) {
    const pages = [...(byDate.get(date) ?? [])];
    if (!currentSaved && current.date === date) pages.push(current);
    pages.sort((a, b) => a.createdAt - b.createdAt);
    if (pages.length === 0) {
      stops.push({ kind: 'blank', date });
      continue;
    }
    for (const page of pages) {
      if (!currentSaved && page.id === current.id) stops.push({ kind: 'blank', date });
      else stops.push({ kind: 'entry', id: page.id, date: page.date, createdAt: page.createdAt });
    }
  }
  return stops;
}

export function pageNeighbors(saved: PageSpot[], current: PageSpot, today: string): { prev: PageStop | null; next: PageStop | null } {
  const stops = pageTrail(saved, current, today);
  const index = stops.findIndex((stop) => (stop.kind === 'entry' ? stop.id === current.id : !saved.some((page) => page.id === current.id) && stop.date === current.date && stop.kind === 'blank'));
  const at = index >= 0 ? index : 0;
  return {
    prev: at > 0 ? stops[at - 1] : null,
    next: at < stops.length - 1 ? stops[at + 1] : null,
  };
}
