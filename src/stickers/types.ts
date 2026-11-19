import type { Rarity, Unlock } from '../logic/access';

export type Palette = {
  main: string;
  alt: string;
  accent: string;
  detail: string;
  soft: string;
};

export type DrawNode =
  | { t: 'c'; cx: number; cy: number; r: number; f: string; s?: string; sw?: number; o?: number }
  | { t: 'e'; cx: number; cy: number; rx: number; ry: number; f: string; s?: string; sw?: number; rot?: number; o?: number }
  | { t: 'r'; x: number; y: number; w: number; h: number; f: string; rx?: number; s?: string; sw?: number; rot?: number; o?: number }
  | { t: 'p'; d: string; f?: string; s?: string; sw?: number; o?: number }
  | { t: 'pg'; pts: string; f: string; s?: string; sw?: number }
  | { t: 'ln'; x1: number; y1: number; x2: number; y2: number; s: string; sw?: number };

export const ART_KEYS = [
  'star',
  'sparkle',
  'moon',
  'cloud',
  'heart',
  'bow',
  'cherry',
  'butterfly',
  'blossom',
  'bunny',
  'cat',
  'frog',
  'bear',
  'chick',
  'mushroom',
  'leaf',
  'strawberry',
  'bee',
  'teapot',
  'loaf',
  'rainbow',
  'sun',
  'smiley',
  'pop',
  'bat',
  'ghost',
  'candle',
  'potion',
  'rose',
  'web',
  'book',
  'quill',
  'envelope',
  'mug',
  'key',
  'shell',
  'fish',
  'starfish',
  'whale',
  'wave',
  'jelly',
  'boba',
  'cake',
  'cookie',
  'scoop',
  'macaron',
  'crystal',
  'crown',
  'gem',
  'comet',
  'planet',
  'daisy',
  'tulip',
  'anchor',
  'coral',
  'seahorse',
  'riceball',
  'pudding',
  'specs',
  'bottle',
  'clip',
  'cupcake',
  'flame',
  'disc',
  'phone',
  'alien',
  'tape',
  'ribbon',
  'acorn',
  'pie',
  'pearl',
] as const;

export type ArtKey = (typeof ART_KEYS)[number];

export type StickerDef = {
  id: string;
  packId: string;
  name: string;
  art: ArtKey;
  rarity: Rarity;
  unlock: Unlock;
  price: number;
  colors: Palette;
};

export type PackDef = {
  id: string;
  name: string;
  blurb: string;
  premium: boolean;
  swatch: string;
  emoji?: string;
  coinPrice?: number;
};
