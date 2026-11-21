export type PageSpot = { id: string; date: string; createdAt: number };

/** Pages in reading order: older first, then the time they were created. */
export function orderedPages<T extends PageSpot>(pages: T[]): T[] {
  return [...pages].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/**
 * Neighbors of the page on screen. A page that is not saved yet still sits in
 * the date order, so a blank or new page can turn onto the written ones.
 */
export function pageNeighbors<T extends PageSpot>(pages: T[], current: PageSpot): { prev: T | null; next: T | null } {
  const ordered = orderedPages(pages);
  const index = ordered.findIndex((entry) => entry.id === current.id);
  if (index >= 0) {
    return {
      prev: index > 0 ? ordered[index - 1] : null,
      next: index < ordered.length - 1 ? ordered[index + 1] : null,
    };
  }
  const nextIndex = ordered.findIndex((entry) => entry.date > current.date || (entry.date === current.date && entry.createdAt > current.createdAt));
  if (nextIndex < 0) return { prev: ordered[ordered.length - 1] ?? null, next: null };
  return { prev: ordered[nextIndex - 1] ?? null, next: ordered[nextIndex] };
}
