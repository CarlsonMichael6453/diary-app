export type PageFilter = { moods: string[]; tags: string[] };

export function emptyFilter(): PageFilter {
  return { moods: [], tags: [] };
}

export function filterIsActive(filter: PageFilter): boolean {
  return filter.moods.length > 0 || filter.tags.length > 0;
}

function sameTag(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Moods match any selected mood. Tags match any selected tag. A mood and a tag must both match. */
export function entryMatches(entry: { mood: string; tags?: string[]; activities?: string[] }, filter: PageFilter): boolean {
  if (filter.moods.length > 0 && !filter.moods.includes(entry.mood)) return false;
  if (filter.tags.length > 0) {
    const have = [...(entry.tags ?? []), ...(entry.activities ?? [])];
    const hit = filter.tags.some((tag) => have.some((item) => sameTag(item, tag)));
    if (!hit) return false;
  }
  return true;
}

export function toggleValue(selected: string[], value: string): string[] {
  const key = value.trim().toLowerCase();
  const on = selected.some((item) => item.trim().toLowerCase() === key);
  return on ? selected.filter((item) => item.trim().toLowerCase() !== key) : [...selected, value];
}
