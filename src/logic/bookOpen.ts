import type { ColorDesign } from '../theme/designs';
import { THEMES } from '../theme/themes';

/** How the cover itself sounds when it opens. Several styles can share a material. */
export const COVER_MATERIALS = ['leather', 'cloth', 'sparkle', 'paper', 'metal', 'vinyl', 'sky', 'lava'] as const;
export type CoverMaterial = (typeof COVER_MATERIALS)[number];

/** Every book style has its own jingle file, named after the style, plus one of these cover effects. */
export const STYLE_OPEN: Record<string, CoverMaterial> = {
  cutesy: 'sparkle',
  girlypop: 'sparkle',
  kawaii: 'cloth',
  candy: 'paper',
  cottagecore: 'cloth',
  academia: 'leather',
  steampunk: 'metal',
  grunge: 'leather',
  ocean: 'sky',
  forest: 'cloth',
  goth: 'leather',
  witchy: 'sky',
  galaxy: 'sky',
  'galaxy-drift': 'sky',
  minimal: 'paper',
  aurora: 'sparkle',
  'sparkle-rain': 'sparkle',
  y2k: 'metal',
  retro: 'vinyl',
  vaporwave: 'vinyl',
  psychedelic: 'vinyl',
  neon: 'metal',
  'neon-glow': 'metal',
  cyberpunk: 'metal',
  rainbow: 'sparkle',
  sunset: 'cloth',
  'lava-lamp': 'lava',
};

const HUE_STYLE: Array<{ max: number; style: string }> = [
  { max: 18, style: 'academia' },
  { max: 50, style: 'sunset' },
  { max: 78, style: 'cottagecore' },
  { max: 165, style: 'forest' },
  { max: 255, style: 'ocean' },
  { max: 320, style: 'galaxy' },
  { max: 360, style: 'cutesy' },
];

function hueOf(hex: string): number {
  const raw = hex.replace('#', '');
  if (raw.length < 6) return 30;
  const n = Number.parseInt(raw.slice(0, 6), 16);
  if (!Number.isFinite(n)) return 30;
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.06) return -1;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function styleForHue(hex: string): string {
  const hue = hueOf(hex);
  if (hue < 0) return 'minimal';
  return HUE_STYLE.find((band) => hue < band.max)?.style ?? 'cutesy';
}

/** The style id whose unique opening clip should play. A custom design picks the closest cover. */
export function bookOpenStyle(input: { themeId?: string | null; design?: Pick<ColorDesign, 'pattern' | 'colorA' | 'metal'> | null }): string {
  if (input.design) {
    if (input.design.metal && input.design.metal !== 'none') return 'aurora';
    if (input.design.pattern === 'hearts') return 'cutesy';
    if (input.design.pattern === 'stars') return 'galaxy';
    return styleForHue(input.design.colorA);
  }
  if (input.themeId && STYLE_OPEN[input.themeId]) return input.themeId;
  return 'cutesy';
}

export function everyStyleHasItsOwnOpenSound(): boolean {
  return THEMES.every((theme) => STYLE_OPEN[theme.id] !== undefined) && new Set(THEMES.map((theme) => theme.id)).size === THEMES.length;
}
