import type { DiaryBook, DiaryEntry, NotePlacement, PhotoPlacement, Settings, StickerPlacement } from '../models/types';
import { sanitizeDesign } from '../theme/designs';
import { sanitizeFontId, sanitizeInk } from '../theme/fonts';
import { getTheme, type ThemeId } from '../theme/themes';

const FRAMES = new Set(['none', 'polaroid', 'tape', 'round']);
const NOTE_STYLES = new Set(['none', 'sticky', 'bubble', 'tag', 'torn', 'highlight']);

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cleanStickers(items: StickerPlacement[] | undefined): StickerPlacement[] {
  return (items ?? []).filter((item) => item && typeof item.id === 'string' && typeof item.stickerId === 'string').map((item) => ({
    ...item,
    x: finite(item.x, 0.5),
    y: finite(item.y, 0.5),
    scale: finite(item.scale, 1),
    rotation: finite(item.rotation, 0),
    z: typeof item.z === 'number' && Number.isFinite(item.z) ? item.z : undefined,
  }));
}

function cleanPhotos(items: PhotoPlacement[] | undefined): PhotoPlacement[] | undefined {
  if (!items) return undefined;
  return items.filter((item) => item && typeof item.id === 'string' && typeof item.uri === 'string').map((item) => ({
    ...item,
    x: finite(item.x, 0.5),
    y: finite(item.y, 0.5),
    scale: finite(item.scale, 1),
    rotation: finite(item.rotation, 0),
    frame: FRAMES.has(item.frame) ? item.frame : 'none',
    z: typeof item.z === 'number' && Number.isFinite(item.z) ? item.z : undefined,
  }));
}

function cleanNotes(items: NotePlacement[] | undefined): NotePlacement[] | undefined {
  if (!items) return undefined;
  return items.filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string').map((item) => ({
    ...item,
    x: finite(item.x, 0.5),
    y: finite(item.y, 0.5),
    scale: finite(item.scale, 1),
    rotation: finite(item.rotation, 0),
    style: NOTE_STYLES.has(item.style) ? item.style : 'none',
    fontId: sanitizeFontId(item.fontId),
    inkColor: sanitizeInk(item.inkColor),
    z: typeof item.z === 'number' && Number.isFinite(item.z) ? item.z : undefined,
  }));
}

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
      stickers: cleanStickers(entry.stickers),
      photoPlacements: cleanPhotos(entry.photoPlacements),
      notes: cleanNotes(entry.notes),
      textZ: typeof entry.textZ === 'number' && Number.isFinite(entry.textZ) ? entry.textZ : undefined,
      photoOnly: Boolean(entry.photoOnly),
      photos: Array.isArray(entry.photos) ? entry.photos.filter((uri) => typeof uri === 'string') : [],
    })),
  };
}
