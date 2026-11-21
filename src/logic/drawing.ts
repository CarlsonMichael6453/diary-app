import { isHexColor } from '../theme/designs';
import { INK_SWATCHES } from '../theme/fonts';

export type Stroke = { points: string; color: string; size?: number; space?: 'pad' | 'page' };

export const PEN_SIZES = [2, 5, 11] as const;

/** The ink palette, plus a few extra brights, so the pencil has at least 28 colors. */
export const DRAW_COLORS = [...INK_SWATCHES, '#FF4D6D', '#FF8A00', '#2E86FF', '#111111'];

export function strokesFrom(raw: string | null | undefined): Stroke[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Stroke[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function padStrokes(strokes: Stroke[]): Stroke[] {
  return strokes.filter((stroke) => stroke.space !== 'page');
}

export function pageStrokes(strokes: Stroke[]): Stroke[] {
  return strokes.filter((stroke) => stroke.space === 'page');
}

/** An eraser stroke is a hole in the ink. It is never painted as a color. */
export function strokeRole(color: string): 'ink' | 'erase' {
  return color === 'eraser' ? 'erase' : 'ink';
}

/** A little pencil. The lead tip sits at (3, 29), which is the cursor hotspot. */
export function pencilSvg(color: string): string {
  const fill = isHexColor(color) ? color : '#3A2A32';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M8 20 L20 8 L24 12 L12 24 Z" fill="${fill}" stroke="#2A211C" stroke-width="1"/><path d="M20 8 L23 5 L27 9 L24 12 Z" fill="#F6E2C4" stroke="#2A211C" stroke-width="1"/><path d="M23 5 L25 3 L29 7 L27 9 Z" fill="#F4F1EA" stroke="#2A211C" stroke-width="1"/><path d="M8 20 L12 24 L6 28 L4 24 Z" fill="#E7C99A" stroke="#2A211C" stroke-width="1"/><path d="M6 28 L4 24 L3 29 Z" fill="#2A211C"/></svg>`;
}

export function pencilCursorCss(color: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(pencilSvg(color))}") 3 29, crosshair`;
}
