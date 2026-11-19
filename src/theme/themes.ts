import { MORE_THEMES } from './moreThemes';

export type ThemeId =
  | 'cutesy'
  | 'goth'
  | 'girlypop'
  | 'rainbow'
  | 'cottagecore'
  | 'y2k'
  | 'minimal'
  | 'kawaii'
  | 'academia'
  | 'ocean'
  | 'neon'
  | 'retro'
  | 'psychedelic'
  | 'vaporwave'
  | 'galaxy'
  | 'grunge'
  | 'steampunk'
  | 'witchy'
  | 'candy'
  | 'forest'
  | 'sunset'
  | 'cyberpunk'
  | 'neon-glow'
  | 'galaxy-drift'
  | 'lava-lamp'
  | 'sparkle-rain'
  | 'aurora';

export type ThemeMotion = 'none' | 'neon' | 'galaxy' | 'lava' | 'sparkle' | 'aurora';

export type PaperStyle = 'lined' | 'dotted' | 'grid' | 'plain' | 'parchment';
export type DecorKind =
  | 'hearts'
  | 'bats'
  | 'sparkles'
  | 'rainbow'
  | 'leaves'
  | 'stars'
  | 'none'
  | 'blossoms'
  | 'books'
  | 'waves';

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  display: string;
  body: string;
  script: string;
  paper: PaperStyle;
  decor: DecorKind;
  radius: number;
  colors: {
    bg: string;
    bg2: string;
    paper: string;
    paperEdge: string;
    ink: string;
    inkSoft: string;
    paperInk: string;
    paperSoft: string;
    line: string;
    accent: string;
    accent2: string;
    accent3: string;
    chip: string;
    chipInk: string;
    tab: string;
    danger: string;
    highlight: string;
    tape: string;
    binding: string;
    card: string;
    onAccent: string;
  };
  premium?: boolean;
  motion?: ThemeMotion;
};

export const THEMES: Theme[] = [
  {
    id: 'cutesy',
    name: 'Cutesy',
    tagline: 'Blush paper, soft corners, a ribbon in the margin.',
    emoji: '🎀',
    display: 'Fraunces_700Bold',
    body: 'Nunito_600SemiBold',
    script: 'Caveat_700Bold',
    paper: 'lined',
    decor: 'hearts',
    radius: 22,
    colors: {
      bg: '#FFF1F4',
      bg2: '#FFE4C8',
      paper: '#FFFDF8',
      paperEdge: '#F3D5DE',
      ink: '#5C3A45',
      inkSoft: '#8A6570',
      paperInk: '#5C3A45',
      paperSoft: '#8A6570',
      line: '#F6D5DE',
      accent: '#F2A2B8',
      accent2: '#F7C98A',
      accent3: '#E7B7F3',
      chip: '#FFE4EC',
      chipInk: '#7A4456',
      tab: '#FFF8F4',
      danger: '#D4536A',
      highlight: '#FFE08A',
      tape: '#F7C6D4',
      binding: '#E7A0B4',
      card: '#FFFFFF',
      onAccent: '#4A2430',
    },
  },
  {
    id: 'goth',
    name: 'Goth',
    tagline: 'Black roses, candlelight, and plum ink.',
    emoji: '🦇',
    display: 'Cinzel_700Bold',
    body: 'LibreBaskerville_400Regular',
    script: 'Caveat_700Bold',
    paper: 'parchment',
    decor: 'bats',
    radius: 16,
    colors: {
      bg: '#141014',
      bg2: '#2A1824',
      paper: '#221C26',
      paperEdge: '#4A3344',
      ink: '#F6EAF0',
      inkSoft: '#CDB4C0',
      paperInk: '#F4E6EE',
      paperSoft: '#C9A8B6',
      line: '#3A2C38',
      accent: '#9B3A55',
      accent2: '#C9A227',
      accent3: '#6E4A86',
      chip: '#3A2432',
      chipInk: '#F6EAF0',
      tab: '#1C161C',
      danger: '#E06A78',
      highlight: '#6B4A22',
      tape: '#4A2A38',
      binding: '#6E2438',
      card: '#241C28',
      onAccent: '#FFF4F6',
    },
  },
  {
    id: 'girlypop',
    name: 'Girlypop',
    tagline: 'Hot pink, extra gloss, sticker-bomb energy.',
    emoji: '💖',
    display: 'Comfortaa_700Bold',
    body: 'Nunito_700Bold',
    script: 'Caveat_700Bold',
    paper: 'dotted',
    decor: 'sparkles',
    radius: 26,
    colors: {
      bg: '#FF4F9A',
      bg2: '#FFB3D9',
      paper: '#FFF0F8',
      paperEdge: '#FFC2E2',
      ink: '#4A1038',
      inkSoft: '#8A3A6A',
      paperInk: '#3A1030',
      paperSoft: '#8A3A6A',
      line: '#FFD0EA',
      accent: '#FF2D95',
      accent2: '#7C5CFF',
      accent3: '#FFE56A',
      chip: '#FFE0F2',
      chipInk: '#7A1458',
      tab: '#FFE6F4',
      danger: '#C81E5A',
      highlight: '#FFE56A',
      tape: '#FF8AC6',
      binding: '#FF4FA3',
      card: '#FFFFFF',
      onAccent: '#FFFFFF',
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    tagline: 'Every margin gets a different color.',
    emoji: '🌈',
    display: 'Quicksand_700Bold',
    body: 'Nunito_600SemiBold',
    script: 'Caveat_700Bold',
    paper: 'plain',
    decor: 'rainbow',
    radius: 20,
    colors: {
      bg: '#FFF6E4',
      bg2: '#D9F6FF',
      paper: '#FFFEFB',
      paperEdge: '#E4E0FF',
      ink: '#2C2A4A',
      inkSoft: '#5C5A7A',
      paperInk: '#2C2A4A',
      paperSoft: '#5C5A7A',
      line: '#E7E4FF',
      accent: '#FF6B6B',
      accent2: '#4ECDC4',
      accent3: '#FFE66D',
      chip: '#FFF1C9',
      chipInk: '#5A3A10',
      tab: '#FFFFFF',
      danger: '#E15555',
      highlight: '#FFE66D',
      tape: '#B8F2E6',
      binding: '#C9B6FF',
      card: '#FFFFFF',
      onAccent: '#2C2A4A',
    },
  },
  {
    id: 'cottagecore',
    name: 'Cottagecore',
    tagline: 'Linen, leaves, and tea-stained lines.',
    emoji: '🍄',
    display: 'Fraunces_700Bold',
    body: 'Nunito_600SemiBold',
    script: 'Caveat_700Bold',
    paper: 'lined',
    decor: 'leaves',
    radius: 18,
    colors: {
      bg: '#E7EFE4',
      bg2: '#F3E2C8',
      paper: '#F7F1E3',
      paperEdge: '#E0CDB0',
      ink: '#3E4A32',
      inkSoft: '#6A7460',
      paperInk: '#3E4A32',
      paperSoft: '#6A7460',
      line: '#E4D3BC',
      accent: '#C47B5A',
      accent2: '#7E9A6A',
      accent3: '#E7C16A',
      chip: '#F3E6D2',
      chipInk: '#5A4632',
      tab: '#F7F3EA',
      danger: '#B5523A',
      highlight: '#F3D48A',
      tape: '#E7C9A4',
      binding: '#8E6A48',
      card: '#FFFBF3',
      onAccent: '#FFF8F0',
    },
  },
  {
    id: 'y2k',
    name: 'Y2K',
    tagline: 'Chrome butterflies and a flip-phone heart.',
    emoji: '💿',
    display: 'Bungee_400Regular',
    body: 'Outfit_600SemiBold',
    script: 'Quicksand_700Bold',
    paper: 'grid',
    decor: 'stars',
    radius: 14,
    colors: {
      bg: '#D7F6FF',
      bg2: '#FFD6F6',
      paper: '#F4FCFF',
      paperEdge: '#B7ECFF',
      ink: '#1A1A40',
      inkSoft: '#4E4E78',
      paperInk: '#1A1A40',
      paperSoft: '#4E4E78',
      line: '#C9F3FF',
      accent: '#FF4FD8',
      accent2: '#3DE0FF',
      accent3: '#C6F54A',
      chip: '#E5FBFF',
      chipInk: '#12304A',
      tab: '#F3FCFF',
      danger: '#E23E8C',
      highlight: '#D6FF6B',
      tape: '#9EEBFF',
      binding: '#7A6CFF',
      card: '#FFFFFF',
      onAccent: '#1A1A40',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Quiet paper. The words do the decorating.',
    emoji: '◻',
    display: 'Outfit_700Bold',
    body: 'Outfit_400Regular',
    script: 'Outfit_400Regular',
    paper: 'plain',
    decor: 'none',
    radius: 10,
    colors: {
      bg: '#F4F4F2',
      bg2: '#E8E8E4',
      paper: '#FBFBFA',
      paperEdge: '#E4E4E0',
      ink: '#1C1C1C',
      inkSoft: '#6A6A66',
      paperInk: '#1C1C1C',
      paperSoft: '#6A6A66',
      line: '#ECECEA',
      accent: '#1C1C1C',
      accent2: '#8A8A84',
      accent3: '#D8D8D2',
      chip: '#EEEEEC',
      chipInk: '#1C1C1C',
      tab: '#FFFFFF',
      danger: '#A33B32',
      highlight: '#F3E7A1',
      tape: '#E6E6E2',
      binding: '#BDBDB8',
      card: '#FFFFFF',
      onAccent: '#FFFFFF',
    },
  },
  {
    id: 'kawaii',
    name: 'Kawaii',
    tagline: 'Round letters, candy dots, a face in the corner.',
    emoji: '🍡',
    display: 'Comfortaa_700Bold',
    body: 'Nunito_600SemiBold',
    script: 'Caveat_700Bold',
    paper: 'dotted',
    decor: 'blossoms',
    radius: 28,
    colors: {
      bg: '#FFF0F6',
      bg2: '#E9E2FF',
      paper: '#FFF9FC',
      paperEdge: '#F8D7E8',
      ink: '#5A3D55',
      inkSoft: '#8A7084',
      paperInk: '#5A3D55',
      paperSoft: '#8A7084',
      line: '#F8D7E8',
      accent: '#FF8FB8',
      accent2: '#B9A0FF',
      accent3: '#FFD0A8',
      chip: '#FFE6F1',
      chipInk: '#6A3A58',
      tab: '#FFF7FB',
      danger: '#D4537A',
      highlight: '#FFE0A3',
      tape: '#FFD0E4',
      binding: '#D7C4FF',
      card: '#FFFFFF',
      onAccent: '#4A2840',
    },
  },
  {
    id: 'academia',
    name: 'Dark Academia',
    tagline: 'Library lamp, cream paper, a pressed rose.',
    emoji: '📖',
    display: 'PlayfairDisplay_700Bold',
    body: 'LibreBaskerville_400Regular',
    script: 'Caveat_700Bold',
    paper: 'lined',
    decor: 'books',
    radius: 12,
    colors: {
      bg: '#241910',
      bg2: '#3A2A1C',
      paper: '#F3E6C8',
      paperEdge: '#E2CFA4',
      ink: '#F6EBD6',
      inkSoft: '#D9C7A6',
      paperInk: '#2B2118',
      paperSoft: '#6A5340',
      line: '#E2D0A8',
      accent: '#6E2E2E',
      accent2: '#1F3D34',
      accent3: '#C6A15B',
      chip: '#3C2C20',
      chipInk: '#F6EBD6',
      tab: '#2C2118',
      danger: '#A33B32',
      highlight: '#F0D48A',
      tape: '#C9B48A',
      binding: '#5C2E24',
      card: '#3A2C22',
      onAccent: '#F6EBD6',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    tagline: 'Salt air, pearl buttons, a tide in the margin.',
    emoji: '🐚',
    display: 'Fraunces_700Bold',
    body: 'Nunito_600SemiBold',
    script: 'Caveat_700Bold',
    paper: 'lined',
    decor: 'waves',
    radius: 20,
    colors: {
      bg: '#E4F4F8',
      bg2: '#D5E7F2',
      paper: '#F3FBFD',
      paperEdge: '#C9E6EE',
      ink: '#163A46',
      inkSoft: '#4E7380',
      paperInk: '#163A46',
      paperSoft: '#4E7380',
      line: '#D3EEF3',
      accent: '#1F8A9E',
      accent2: '#F2B56B',
      accent3: '#7EC8C3',
      chip: '#E5F6F8',
      chipInk: '#14505C',
      tab: '#F4FBFC',
      danger: '#C4544A',
      highlight: '#FFE3A3',
      tape: '#B7E4EA',
      binding: '#1D6E80',
      card: '#FFFFFF',
      onAccent: '#F4FBFC',
    },
  },
  ...MORE_THEMES,
];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function isDarkHex(hex: string): boolean {
  const raw = hex.replace('#', '');
  if (raw.length < 6) return false;
  const n = Number.parseInt(raw.slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 0.299 + g * 0.587 + b * 0.114 < 150;
}
