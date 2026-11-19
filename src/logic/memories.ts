export type Dated = { id: string; date: string };

export function memoriesOnThisDay<T extends Dated>(entries: T[], today: string): { yearsAgo: number; entry: T }[] {
  const [, month, day] = today.split('-');
  const year = Number(today.slice(0, 4));
  return entries
    .filter((entry) => {
      const [entryYear, entryMonth, entryDay] = entry.date.split('-');
      return entryMonth === month && entryDay === day && Number(entryYear) < year;
    })
    .map((entry) => ({ yearsAgo: year - Number(entry.date.slice(0, 4)), entry }))
    .sort((a, b) => a.yearsAgo - b.yearsAgo);
}

export function entryBookId(entry: { bookId?: string | null }): string {
  return entry.bookId || 'daily';
}

export function backupIsDue(lastBackupAt: string | null, today: string, everyDays: number): boolean {
  if (!lastBackupAt) return true;
  const last = lastBackupAt.slice(0, 10);
  const start = new Date(`${last}T00:00:00`);
  const end = new Date(`${today}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return days >= everyDays;
}
