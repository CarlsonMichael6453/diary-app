export type RoomTheme = {
  id: string;
  name: string;
  wall: string;
  floor: string;
  trim: string;
  window: string;
  price: number;
  premium?: boolean;
};

export type RoomGoods = {
  id: string;
  name: string;
  price: number;
  premium?: boolean;
  seat?: boolean;
  kind: 'furniture' | 'plush';
};

export const ROOM_THEMES: RoomTheme[] = [
  { id: 'cottage', name: 'Cozy cottage', wall: '#F6E2C4', floor: '#E7C99A', trim: '#8C5A3C', window: '#C9E7F2', price: 0 },
  { id: 'library', name: 'Attic library', wall: '#E7D7C3', floor: '#8C5A3C', trim: '#3A2A22', window: '#D9C7A3', price: 30 },
  { id: 'beach', name: 'Beach hut', wall: '#F7E7C8', floor: '#E7C98A', trim: '#2E86AB', window: '#9FD6E8', price: 35 },
  { id: 'starry', name: 'Starry night', wall: '#2A3358', floor: '#1C2440', trim: '#F6C445', window: '#0E1630', price: 40 },
  { id: 'greenhouse', name: 'Garden greenhouse', wall: '#E7F4D8', floor: '#C4A574', trim: '#3E7A45', window: '#B7E4C7', price: 25 },
  { id: 'candy', name: 'Candy pastel', wall: '#F8D5E4', floor: '#F3C6D8', trim: '#E86A9A', window: '#FFF0F6', price: 0, premium: true },
];

export const FURNITURE: RoomGoods[] = [
  { id: 'rug', name: 'Round rug', price: 0, kind: 'furniture' },
  { id: 'bed', name: 'Bed', price: 20, seat: true, kind: 'furniture' },
  { id: 'armchair', name: 'Armchair', price: 24, seat: true, kind: 'furniture' },
  { id: 'bookshelf', name: 'Bookshelf', price: 22, kind: 'furniture' },
  { id: 'desk', name: 'Desk', price: 26, kind: 'furniture' },
  { id: 'lamp', name: 'Lamp', price: 15, kind: 'furniture' },
  { id: 'plant', name: 'Plant', price: 12, kind: 'furniture' },
  { id: 'curtains', name: 'Window curtains', price: 18, kind: 'furniture' },
  { id: 'clock', name: 'Wall clock', price: 16, kind: 'furniture' },
  { id: 'lights', name: 'String lights', price: 18, kind: 'furniture' },
  { id: 'beanbag', name: 'Beanbag', price: 20, seat: true, kind: 'furniture' },
  { id: 'record', name: 'Record player', price: 28, kind: 'furniture' },
  { id: 'fishbowl', name: 'Fishbowl', price: 14, kind: 'furniture' },
  { id: 'tea', name: 'Tea set', price: 12, kind: 'furniture' },
  { id: 'catbed', name: 'Cat bed', price: 16, seat: true, kind: 'furniture' },
  { id: 'shelf', name: 'Wall shelf', price: 14, kind: 'furniture' },
  { id: 'poster', name: 'Poster', price: 10, kind: 'furniture' },
  { id: 'frame', name: 'Wood frame', price: 18, kind: 'furniture' },
  { id: 'frame-gold', name: 'Gold frame', price: 16, kind: 'furniture' },
  { id: 'frame-pastel', name: 'Pastel frame', price: 12, kind: 'furniture' },
  { id: 'frame-polaroid', name: 'Polaroid frame', price: 14, kind: 'furniture' },
  { id: 'easel', name: 'Drawing easel', price: 22, kind: 'furniture' },
  { id: 'cushion', name: 'Floor cushion', price: 8, kind: 'furniture' },
  { id: 'pumpkin', name: 'Seasonal pumpkin', price: 10, kind: 'furniture' },
];

export const PLUSHES: RoomGoods[] = [
  'mochi', 'batsy', 'sprout', 'glitter', 'prism', 'inky', 'pip', 'nova', 'shelly', 'ghosty', 'ember', 'lumi',
].map((id) => ({ id: `plush-${id}`, name: `${id} plush`, price: 25, kind: 'plush' as const }));

export function themeById(id: string): RoomTheme {
  return ROOM_THEMES.find((theme) => theme.id === id) ?? ROOM_THEMES[0];
}

export function goodsById(id: string): RoomGoods | undefined {
  return [...FURNITURE, ...PLUSHES].find((item) => item.id === id);
}

export function isFrame(kind: string): boolean {
  return kind === 'frame' || kind.startsWith('frame-');
}
