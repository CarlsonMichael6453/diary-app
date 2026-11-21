/** The short label on the tags box. The stored lists stay separate. */
export function tagSummary(tags: string[] | undefined, activities: string[] | undefined): string {
  const items = [...(activities ?? []), ...(tags ?? [])];
  if (items.length === 0) return 'Tags';
  if (items.length === 1) return items[0];
  return `${items[0]} +${items.length - 1}`;
}

export function cleanTag(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function sameTag(a: string, b: string): boolean {
  return cleanTag(a).toLowerCase() === cleanTag(b).toLowerCase();
}

/** Every tag the diary knows, from the saved list and from pages. */
export function mergeTagCatalog(saved: string[] | undefined, pages: { tags?: string[] }[]): string[] {
  const seen = new Map<string, string>();
  const names = [...(saved ?? []), ...pages.flatMap((page) => page.tags ?? [])];
  for (const name of names) {
    const clean = cleanTag(name);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) seen.set(key, clean);
  }
  return [...seen.values()];
}

export function toggleTag(selected: string[], name: string): string[] {
  const on = selected.some((item) => sameTag(item, name));
  return on ? selected.filter((item) => !sameTag(item, name)) : [...selected, name];
}

/** Add a new tag and select it. A repeat selects the one that already exists. */
export function selectCreatedTag(selected: string[], catalog: string[], raw: string): { tags: string[]; catalog: string[] } {
  const clean = cleanTag(raw);
  if (!clean) return { tags: selected, catalog };
  const known = catalog.find((item) => sameTag(item, clean)) ?? selected.find((item) => sameTag(item, clean));
  const name = known ?? clean;
  const tags = selected.some((item) => sameTag(item, name)) ? selected : [...selected, name];
  const nextCatalog = catalog.some((item) => sameTag(item, name)) ? catalog : [...catalog, name];
  return { tags, catalog: nextCatalog };
}
