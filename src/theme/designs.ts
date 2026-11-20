import { getTheme, isDarkHex, type Theme } from './themes';

export type PaintedTheme = Theme & { design: ColorDesign | null };

export const PATTERN_IDS = [
  'solid',
  'split',
  'stripes-h',
  'stripes-v',
  'stripes-d',
  'gradient-linear',
  'gradient-radial',
  'dots',
  'checkers',
  'chevron',
  'hearts',
  'stars',
] as const;

export type PatternId = (typeof PATTERN_IDS)[number];

export const MOTION_IDS = ['none', 'flow', 'scroll', 'drift', 'wave', 'shimmer'] as const;
export type MotionId = (typeof MOTION_IDS)[number];

export const METAL_IDS = ['none', 'gold', 'silver', 'rose-gold', 'chrome', 'holo', 'copper'] as const;
export type MetalId = (typeof METAL_IDS)[number];

export type ColorDesign = {
  pattern: PatternId;
  colorA: string;
  colorB: string;
  motion: MotionId;
  metal: MetalId;
};

export const PATTERN_CHOICES: { id: PatternId; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'split', label: 'Two-tone' },
  { id: 'stripes-h', label: 'Stripes' },
  { id: 'stripes-v', label: 'Vertical stripes' },
  { id: 'stripes-d', label: 'Diagonal stripes' },
  { id: 'gradient-linear', label: 'Linear gradient' },
  { id: 'gradient-radial', label: 'Radial gradient' },
  { id: 'dots', label: 'Polka dots' },
  { id: 'checkers', label: 'Checkers' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'stars', label: 'Stars' },
];

export const MOTION_CHOICES: { id: Exclude<MotionId, 'none'>; label: string }[] = [
  { id: 'flow', label: 'Flowing gradient' },
  { id: 'scroll', label: 'Scrolling stripes' },
  { id: 'drift', label: 'Drifting shapes' },
  { id: 'wave', label: 'Wave' },
  { id: 'shimmer', label: 'Shimmer pulse' },
];

export const METAL_CHOICES: { id: Exclude<MetalId, 'none'>; label: string; base: string; shine: string; deep: string }[] = [
  { id: 'gold', label: 'Gold', base: '#D4A017', shine: '#FFF1B8', deep: '#8A5A10' },
  { id: 'silver', label: 'Silver', base: '#C5CDD6', shine: '#FFFFFF', deep: '#6E7882' },
  { id: 'rose-gold', label: 'Rose gold', base: '#E0A090', shine: '#FFE4DC', deep: '#A85A55' },
  { id: 'chrome', label: 'Chrome', base: '#D7E4EE', shine: '#FFFFFF', deep: '#5C6B7A' },
  { id: 'holo', label: 'Holographic', base: '#C9B6F2', shine: '#B6FFF2', deep: '#F2A3C9' },
  { id: 'copper', label: 'Copper', base: '#C46B3A', shine: '#FFD0A8', deep: '#6A3018' },
];

export const FREE_SWATCHES = [
  '#F4A3B8',
  '#E36B8A',
  '#F2C14E',
  '#FFE56A',
  '#7DCE82',
  '#1F8A9E',
  '#8B6AD6',
  '#FF4F9A',
  '#2C2433',
  '#FFFDF8',
  '#C47B5A',
  '#E2544A',
  '#1C3F6E',
  '#F7F1E1',
  '#5E7A48',
  '#FF8A7A',
];

const METAL_LOOKUP = Object.fromEntries(METAL_CHOICES.map((metal) => [metal.id, metal])) as Record<
  Exclude<MetalId, 'none'>,
  (typeof METAL_CHOICES)[number]
>;

export function defaultDesign(): ColorDesign {
  return { pattern: 'gradient-linear', colorA: '#F4A3B8', colorB: '#F2C14E', motion: 'none', metal: 'none' };
}

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function isMetalSwatch(value: string): value is Exclude<MetalId, 'none'> {
  return value in METAL_LOOKUP;
}

export function metalById(id: Exclude<MetalId, 'none'>) {
  return METAL_LOOKUP[id];
}

export function swatchHex(value: string): string {
  if (isMetalSwatch(value)) return METAL_LOOKUP[value].base;
  if (isHexColor(value)) return value.toUpperCase() === value ? value : value;
  return '#F4A3B8';
}

export function shineHex(value: string): string {
  if (isMetalSwatch(value)) return METAL_LOOKUP[value].shine;
  return '#FFFFFF';
}

export function designNeedsPlus(design: ColorDesign): boolean {
  return design.motion !== 'none' || design.metal !== 'none' || isMetalSwatch(design.colorA) || isMetalSwatch(design.colorB);
}

/** Without Diary Plus, motion and metallic shine come off. Metal swatches fall back to free colors. */
export function visibleDesign(design: ColorDesign | null | undefined, premium: boolean): ColorDesign | null {
  if (!design || !PATTERN_IDS.includes(design.pattern)) return null;
  if (premium || !designNeedsPlus(design)) return design;
  return {
    pattern: design.pattern,
    colorA: isMetalSwatch(design.colorA) ? FREE_SWATCHES[0] : swatchHex(design.colorA),
    colorB: isMetalSwatch(design.colorB) ? FREE_SWATCHES[1] : swatchHex(design.colorB),
    motion: 'none',
    metal: 'none',
  };
}

export function shouldAnimate(design: ColorDesign, reduceMotion: boolean): boolean {
  if (reduceMotion) return false;
  return design.motion !== 'none' || design.metal !== 'none' || isMetalSwatch(design.colorA) || isMetalSwatch(design.colorB);
}

export function activeMetal(design: ColorDesign): Exclude<MetalId, 'none'> | null {
  if (design.metal !== 'none') return design.metal;
  if (isMetalSwatch(design.colorA)) return design.colorA;
  if (isMetalSwatch(design.colorB)) return design.colorB;
  return null;
}

function channel(hex: string): { r: number; g: number; b: number } {
  const n = Number.parseInt(hex.replace('#', '').slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function mixHex(a: string, b: string, t: number): string {
  const from = channel(swatchHex(a));
  const to = channel(swatchHex(b));
  return rgbToHex(from.r + (to.r - from.r) * t, from.g + (to.g - from.g) * t, from.b + (to.b - from.b) * t);
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const amount = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - amount * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

export function contrastInk(hex: string): { ink: string; soft: string; onAccent: string } {
  if (isDarkHex(swatchHex(hex))) return { ink: '#F7F1E8', soft: '#E4D3C4', onAccent: '#2A211C' };
  return { ink: '#3A2A32', soft: '#6E5862', onAccent: '#3A2A32' };
}

export function sanitizeDesign(value: unknown): ColorDesign | null {
  if (!value || typeof value !== 'object') return null;
  const design = value as Partial<ColorDesign>;
  if (!design.pattern || !PATTERN_IDS.includes(design.pattern)) return null;
  if (!design.motion || !MOTION_IDS.includes(design.motion)) return null;
  if (!design.metal || !METAL_IDS.includes(design.metal)) return null;
  if (!design.colorA || !isUsableColor(design.colorA) || !design.colorB || !isUsableColor(design.colorB)) return null;
  return { pattern: design.pattern, colorA: design.colorA, colorB: design.colorB, motion: design.motion, metal: design.metal };
}

function isUsableColor(value: string): boolean {
  return isHexColor(value) || isMetalSwatch(value);
}

/** A page with no design of its own wears the book's design. A saved page design stays put when the book changes. */
export function inheritedDesign(bookDesign: ColorDesign | null | undefined, pageDesign: ColorDesign | null | undefined): ColorDesign | null {
  return sanitizeDesign(pageDesign) ?? sanitizeDesign(bookDesign);
}

export function resolveEntryLook(
  book: { themeId: string; design?: ColorDesign | null },
  entry: { themeOverride?: string | null; design?: ColorDesign | null },
  premium: boolean,
): PaintedTheme {
  return applyDesign(getTheme(entry.themeOverride || book.themeId), inheritedDesign(book.design, entry.design), premium);
}

export function applyDesign(theme: Theme, design: ColorDesign | null | undefined, premium: boolean): PaintedTheme {
  const visible = visibleDesign(design, premium);
  if (!visible) return { ...theme, design: null };
  const a = swatchHex(visible.colorA);
  const b = swatchHex(visible.colorB);
  const ink = contrastInk(a);
  const card = mixHex(a, isDarkHex(a) ? '#2A2428' : '#FFFFFF', 0.82);
  return {
    ...theme,
    design: visible,
    colors: {
      ...theme.colors,
      bg: a,
      bg2: b,
      paper: a,
      paperEdge: mixHex(a, b, 0.45),
      accent: b,
      accent2: a,
      accent3: mixHex(a, b, 0.5),
      binding: mixHex(a, '#1A1420', 0.35),
      line: mixHex(ink.soft, a, 0.35),
      ink: ink.ink,
      inkSoft: ink.soft,
      paperInk: ink.ink,
      paperSoft: ink.soft,
      chip: mixHex(a, '#FFFFFF', 0.55),
      chipInk: ink.ink,
      tab: card,
      card,
      tape: mixHex(b, '#FFFFFF', 0.4),
      highlight: mixHex(b, '#FFFFFF', 0.35),
      onAccent: ink.onAccent,
    },
  };
}
