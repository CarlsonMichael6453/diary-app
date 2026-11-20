import type { ColorDesign } from '../theme/designs';

/** Original opening jingles. One file per mood family. */
export const OPEN_FAMILIES = [
  'cozy',
  'floral',
  'ocean',
  'forest',
  'night',
  'retro',
  'elegant',
  'christmas',
  'halloween',
  'valentine',
  'festival',
  'sunset',
] as const;

export type OpenFamily = (typeof OPEN_FAMILIES)[number];

/** Free styles, animated Plus styles, and the feel of each. */
export const THEME_FAMILY: Record<string, OpenFamily> = {
  cutesy: 'floral',
  girlypop: 'floral',
  kawaii: 'floral',
  candy: 'floral',
  cottagecore: 'cozy',
  academia: 'cozy',
  steampunk: 'cozy',
  grunge: 'cozy',
  ocean: 'ocean',
  forest: 'forest',
  goth: 'night',
  witchy: 'night',
  galaxy: 'night',
  'galaxy-drift': 'night',
  minimal: 'elegant',
  aurora: 'elegant',
  'sparkle-rain': 'elegant',
  y2k: 'retro',
  retro: 'retro',
  vaporwave: 'retro',
  psychedelic: 'retro',
  neon: 'retro',
  'neon-glow': 'retro',
  cyberpunk: 'retro',
  rainbow: 'festival',
  sunset: 'sunset',
  'lava-lamp': 'sunset',
};

/** Seasonal packs share those families. They do not replace the book's own theme unless asked. */
export const PACK_FAMILY: Record<string, OpenFamily> = {
  christmas: 'christmas',
  halloween: 'halloween',
  'dia-de-muertos': 'halloween',
  valentines: 'valentine',
  'new-year': 'festival',
  'lunar-new-year': 'festival',
  diwali: 'festival',
  hanukkah: 'festival',
  birthday: 'festival',
  pride: 'festival',
  'fourth-july': 'festival',
  easter: 'floral',
  'mothers-day': 'floral',
  summer: 'ocean',
  'st-patricks': 'forest',
  thanksgiving: 'cozy',
  kwanzaa: 'cozy',
  'fathers-day': 'cozy',
  'back-to-school': 'cozy',
};

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

export function familyForHue(hex: string): OpenFamily {
  const hue = hueOf(hex);
  if (hue < 0) return 'cozy';
  if (hue < 18) return 'cozy';
  if (hue < 50) return 'sunset';
  if (hue < 78) return 'cozy';
  if (hue < 165) return 'forest';
  if (hue < 255) return 'ocean';
  if (hue < 320) return 'night';
  return 'floral';
}

export function familyForDesign(design: Pick<ColorDesign, 'pattern' | 'colorA' | 'metal'>): OpenFamily {
  if (design.metal && design.metal !== 'none') return 'elegant';
  if (design.pattern === 'hearts') return 'floral';
  if (design.pattern === 'stars') return 'night';
  return familyForHue(design.colorA);
}

/** A custom color design chooses the jingle. Otherwise the book style does. */
export function bookOpenFamily(input: { themeId?: string | null; design?: Pick<ColorDesign, 'pattern' | 'colorA' | 'metal'> | null }): OpenFamily {
  if (input.design) return familyForDesign(input.design);
  return THEME_FAMILY[input.themeId ?? ''] ?? 'cozy';
}
