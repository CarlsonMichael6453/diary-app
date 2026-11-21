/** The short label on the tags box. The stored lists stay separate. */
export function tagSummary(tags: string[] | undefined, activities: string[] | undefined): string {
  const items = [...(activities ?? []), ...(tags ?? [])];
  if (items.length === 0) return 'Tags';
  if (items.length === 1) return items[0];
  return `${items[0]} +${items.length - 1}`;
}
