import type { DiaryBook, DiaryEntry, Settings } from '../models/types';
import { sanitizeDesign } from '../theme/designs';
import { sanitizeFontId, sanitizeInk } from '../theme/fonts';
import { getTheme, type ThemeId } from '../theme/themes';

/** Keep each book's design and each page override when a backup is restored. */
export function restoreSavedDesigns(
  settings: Settings,
  entries: DiaryEntry[],
  books?: DiaryBook[],
): { settings: Settings; entries: DiaryEntry[] } {
  const source = books ?? settings.books ?? [];
  const cleanBooks = source.map((book) => ({
    ...book,
    themeId: getTheme(book.themeId).id as ThemeId,
    design: sanitizeDesign(book.design),
    fontId: sanitizeFontId(book.fontId),
    inkColor: sanitizeInk(book.inkColor),
  }));
  const active = cleanBooks.find((book) => book.id === settings.activeBookId) ?? cleanBooks[0];
  return {
    settings: {
      ...settings,
      books: cleanBooks.length > 0 ? cleanBooks : settings.books,
      themeId: (active?.themeId ?? getTheme(settings.themeId).id) as ThemeId,
      activeBookId: active?.id ?? settings.activeBookId,
      fontId: sanitizeFontId(settings.fontId),
      inkColor: sanitizeInk(settings.inkColor),
    },
    entries: entries.map((entry) => ({
      ...entry,
      themeOverride: entry.themeOverride && getTheme(entry.themeOverride).id === entry.themeOverride ? entry.themeOverride : null,
      design: sanitizeDesign(entry.design) ?? undefined,
      fontId: sanitizeFontId(entry.fontId),
      inkColor: sanitizeInk(entry.inkColor),
    })),
  };
}
