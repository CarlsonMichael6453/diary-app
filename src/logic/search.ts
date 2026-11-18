export type TextPart = { text: string; hit: boolean };

export function splitHighlight(text: string, query: string): TextPart[] {
  const needle = query.trim();
  if (!needle) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const target = needle.toLowerCase();
  const parts: TextPart[] = [];
  let cursor = 0;
  let index = lower.indexOf(target);
  while (index !== -1) {
    if (index > cursor) parts.push({ text: text.slice(cursor, index), hit: false });
    parts.push({ text: text.slice(index, index + needle.length), hit: true });
    cursor = index + needle.length;
    index = lower.indexOf(target, cursor);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts.filter((part) => part.text.length > 0);
}

export function snippetAround(text: string, query: string, radius = 42): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const needle = query.trim().toLowerCase();
  if (!needle) return clean.slice(0, radius * 2);
  const index = clean.toLowerCase().indexOf(needle);
  if (index < 0) return clean.slice(0, radius * 2);
  const start = Math.max(0, index - radius);
  const end = Math.min(clean.length, index + needle.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < clean.length ? '…' : '';
  return `${prefix}${clean.slice(start, end)}${suffix}`;
}
