import { isHexColor, mixHex, type PaintedTheme } from './designs';

export type FontChoice = {
  id: string;
  name: string;
  kind: string;
  display: string;
  body: string;
  script: string;
};

/** Loaded with expo-google-fonts. The picker draws each name in its own face. */
export const FONT_CHOICES: FontChoice[] = [
  { id: 'nunito', name: 'Nunito', kind: 'Rounded sans', display: 'Nunito_800ExtraBold', body: 'Nunito_600SemiBold', script: 'Nunito_700Bold' },
  { id: 'outfit', name: 'Outfit', kind: 'Clean sans', display: 'Outfit_700Bold', body: 'Outfit_400Regular', script: 'Outfit_600SemiBold' },
  { id: 'quicksand', name: 'Quicksand', kind: 'Soft sans', display: 'Quicksand_700Bold', body: 'Quicksand_500Medium', script: 'Quicksand_600SemiBold' },
  { id: 'comfortaa', name: 'Comfortaa', kind: 'Cute rounded', display: 'Comfortaa_700Bold', body: 'Comfortaa_500Medium', script: 'Comfortaa_700Bold' },
  { id: 'caveat', name: 'Caveat', kind: 'Handwriting', display: 'Caveat_700Bold', body: 'Caveat_500Medium', script: 'Caveat_700Bold' },
  { id: 'patrick', name: 'Patrick Hand', kind: 'Notebook', display: 'PatrickHand_400Regular', body: 'PatrickHand_400Regular', script: 'PatrickHand_400Regular' },
  { id: 'pacifico', name: 'Pacifico', kind: 'Script', display: 'Pacifico_400Regular', body: 'Pacifico_400Regular', script: 'Pacifico_400Regular' },
  { id: 'marker', name: 'Permanent Marker', kind: 'Marker', display: 'PermanentMarker_400Regular', body: 'PermanentMarker_400Regular', script: 'PermanentMarker_400Regular' },
  { id: 'playfair', name: 'Playfair', kind: 'Editorial serif', display: 'PlayfairDisplay_700Bold', body: 'PlayfairDisplay_500Medium', script: 'PlayfairDisplay_700Bold' },
  { id: 'fraunces', name: 'Fraunces', kind: 'Soft serif', display: 'Fraunces_700Bold', body: 'Fraunces_500Medium', script: 'Fraunces_700Bold' },
  { id: 'baskerville', name: 'Libre Baskerville', kind: 'Book serif', display: 'LibreBaskerville_700Bold', body: 'LibreBaskerville_400Regular', script: 'LibreBaskerville_700Bold' },
  { id: 'lora', name: 'Lora', kind: 'Reading serif', display: 'Lora_700Bold', body: 'Lora_400Regular', script: 'Lora_600SemiBold' },
  { id: 'cinzel', name: 'Cinzel', kind: 'Classic', display: 'Cinzel_700Bold', body: 'Cinzel_600SemiBold', script: 'Cinzel_700Bold' },
  { id: 'typewriter', name: 'Special Elite', kind: 'Typewriter', display: 'SpecialElite_400Regular', body: 'SpecialElite_400Regular', script: 'SpecialElite_400Regular' },
  { id: 'plex', name: 'IBM Plex Mono', kind: 'Mono', display: 'IBMPlexMono_700Bold', body: 'IBMPlexMono_400Regular', script: 'IBMPlexMono_500Medium' },
  { id: 'bungee', name: 'Bungee', kind: 'Block', display: 'Bungee_400Regular', body: 'Bungee_400Regular', script: 'Bungee_400Regular' },
];

export const INK_SWATCHES = [
  '#3A2A32',
  '#1A1420',
  '#2C2433',
  '#4A2E22',
  '#6A3030',
  '#8C2F39',
  '#C4544A',
  '#E36B8A',
  '#A85A55',
  '#6E3A55',
  '#5C3A45',
  '#1C3F6E',
  '#163A46',
  '#1F6B4A',
  '#3E4A32',
  '#5E7A48',
  '#8A5A10',
  '#6A4A12',
  '#5C6B7A',
  '#4A3F6B',
  '#7C5CFF',
  '#F2C14E',
  '#FFFDF8',
  '#F7F1E8',
  '#E8EEF2',
  '#D7E4EE',
  '#F4A3B8',
  '#7DCE82',
];

const FONT_IDS = new Set(FONT_CHOICES.map((font) => font.id));

export function fontById(id: string | null | undefined): FontChoice | null {
  if (!id) return null;
  return FONT_CHOICES.find((font) => font.id === id) ?? null;
}

export function sanitizeFontId(value: unknown): string | null {
  return typeof value === 'string' && FONT_IDS.has(value) ? value : null;
}

export function sanitizeInk(value: unknown): string | null {
  return typeof value === 'string' && isHexColor(value) ? value : null;
}

export function inheritedType(
  book: { fontId?: string | null; inkColor?: string | null },
  page: { fontId?: string | null; inkColor?: string | null },
): { fontId: string | null; inkColor: string | null } {
  return {
    fontId: sanitizeFontId(page.fontId) ?? sanitizeFontId(book.fontId),
    inkColor: sanitizeInk(page.inkColor) ?? sanitizeInk(book.inkColor),
  };
}

export function applyType(theme: PaintedTheme, fontId?: string | null, ink?: string | null): PaintedTheme {
  const font = fontById(sanitizeFontId(fontId));
  const color = sanitizeInk(ink);
  return {
    ...theme,
    display: font?.display ?? theme.display,
    body: font?.body ?? theme.body,
    script: font?.script ?? theme.script,
    colors: color
      ? { ...theme.colors, paperInk: color, paperSoft: mixHex(color, '#FFFFFF', 0.28), ink: color }
      : theme.colors,
  };
}
