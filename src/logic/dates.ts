/** Local calendar dates as YYYY-MM-DD. Never use UTC here — a diary page belongs to the writer's day. */

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(dateKey: string, delta: number): string {
  const date = parseKey(dateKey);
  date.setDate(date.getDate() + delta);
  return todayKey(date);
}

export function dayOfYear(dateKey: string): number {
  const date = parseKey(dateKey);
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.round((date.getTime() - start.getTime()) / 86_400_000);
}

export function formatPretty(dateKey: string): string {
  return parseKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLong(dateKey: string): string {
  return parseKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function isSameMonth(dateKey: string, year: number, month: number): boolean {
  const date = parseKey(dateKey);
  return date.getFullYear() === year && date.getMonth() === month;
}
