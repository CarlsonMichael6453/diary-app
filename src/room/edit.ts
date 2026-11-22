import { goodsById, isFrame, themeById, type RoomGoods } from './catalog';

export type PlacedItem = {
  id: string;
  kind: string;
  x: number;
  y: number;
  flip: boolean;
  z?: number;
  scale?: number;
  photo?: string | null;
  drawing?: string | null;
};

export type PalRoom = {
  themeId: string;
  ownedThemes: string[];
  ownedKinds: string[];
  items: PlacedItem[];
};

export function clampSpot(value: number, loose = false): number {
  const edge = loose ? 0.02 : 0.1;
  return Math.min(1 - edge, Math.max(edge, value));
}

export function moveItem(room: PalRoom, id: string, x: number, y: number): PalRoom {
  const current = room.items.find((item) => item.id === id);
  const loose = goodsById(current?.kind ?? '')?.kind === 'plush' || isFrame(current?.kind ?? '');
  const top = room.items.reduce((max, item) => Math.max(max, item.z ?? 0), 0) + 1;
  return {
    ...room,
    items: room.items.map((item) => (item.id === id ? { ...item, x: clampSpot(x, loose), y: clampSpot(y, loose), z: loose ? top : item.z } : item)),
  };
}

export function flipItem(room: PalRoom, id: string): PalRoom {
  return { ...room, items: room.items.map((item) => (item.id === id ? { ...item, flip: !item.flip } : item)) };
}

export function removeItem(room: PalRoom, id: string): PalRoom {
  return { ...room, items: room.items.filter((item) => item.id !== id) };
}

export function patchItem(room: PalRoom, id: string, patch: Partial<Pick<PlacedItem, 'photo' | 'drawing' | 'scale'>>): PalRoom {
  return { ...room, items: room.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) };
}

export const FRAME_MIN = 0.65;
export const FRAME_MAX = 2.2;

export function resizeItem(room: PalRoom, id: string, scale: number): PalRoom {
  const next = Math.min(FRAME_MAX, Math.max(FRAME_MIN, Math.round(scale * 100) / 100));
  return { ...room, items: room.items.map((item) => (item.id === id ? { ...item, scale: next } : item)) };
}

export function placeItem(room: PalRoom, kind: string, id: string): PalRoom {
  if (!room.ownedKinds.includes(kind)) return room;
  const frame = isFrame(kind);
  return { ...room, items: [...room.items, { id, kind, x: frame ? 0.42 : 0.5, y: frame ? 0.26 : 0.62, flip: false, scale: frame ? 1 : undefined }] };
}

export function seatFor(room: PalRoom): { x: number; y: number } | null {
  const seats = room.items.filter((item) => goodsById(item.kind)?.seat);
  const seat = seats.sort((a, b) => a.y - b.y)[0];
  return seat ? { x: seat.x, y: seat.y - 0.08 } : null;
}

export function buyGoods(room: PalRoom, coins: number, premium: boolean, goods: RoomGoods): { ok: boolean; message: string; room: PalRoom; coins: number } {
  if (room.ownedKinds.includes(goods.id)) return { ok: false, message: 'Already in the room.', room, coins };
  if (goods.premium && !premium) return { ok: false, message: 'That one is Diary Plus.', room, coins };
  if (coins < goods.price) return { ok: false, message: `You need ${goods.price} coins.`, room, coins };
  return { ok: true, message: `${goods.name} is yours.`, room: { ...room, ownedKinds: [...room.ownedKinds, goods.id] }, coins: coins - goods.price };
}

export const SAMPLE_FRAME =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><rect width="80" height="64" fill="#F6C445"/><circle cx="28" cy="24" r="10" fill="#FFF6D8"/><path d="M6 58 L26 30 L44 48 L56 36 L74 58 Z" fill="#7DCE82"/></svg>');

export const SAMPLE_MOON =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><rect width="80" height="64" fill="#1C2440"/><circle cx="34" cy="28" r="12" fill="#F6C445"/><circle cx="40" cy="24" r="10" fill="#1C2440"/><circle cx="58" cy="16" r="1.5" fill="#FFF6D8"/><circle cx="16" cy="18" r="1" fill="#FFF6D8"/></svg>');

export const SAMPLE_HOUSE =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><rect width="80" height="64" fill="#9FD6E8"/><rect y="40" width="80" height="24" fill="#7DCE82"/><rect x="28" y="28" width="28" height="22" fill="#E85D4C"/><path d="M22 28 L42 12 L62 28 Z" fill="#8C5A3C"/><rect x="38" y="38" width="8" height="12" fill="#F4E2C4"/></svg>');

export const SAMPLE_DRAWING = JSON.stringify([
  { points: '18,78 18,42 62,42 62,78 18,78', color: '#E85D4C', size: 5, space: 'pad' },
  { points: '12,42 40,14 68,42', color: '#8C5A3C', size: 5, space: 'pad' },
  { points: '34,78 34,58 46,58 46,78', color: '#5C3A45', size: 4, space: 'pad' },
  { points: '78,22 86,22 82,14 82,30 74,22 90,22', color: '#F6C445', size: 4, space: 'pad' },
]);

export function defaultRoom(): PalRoom {
  return {
    themeId: 'cottage',
    ownedThemes: ['cottage', 'library'],
    ownedKinds: ['rug', 'bed', 'armchair', 'lamp', 'plant', 'bookshelf', 'frame', 'frame-gold', 'frame-polaroid', 'easel', 'catbed', 'poster', 'plush-sprout', 'plush-mochi'],
    items: [
      { id: 'placed-rug', kind: 'rug', x: 0.5, y: 0.82, flip: false },
      { id: 'placed-bed', kind: 'bed', x: 0.28, y: 0.64, flip: false },
      { id: 'placed-chair', kind: 'armchair', x: 0.78, y: 0.66, flip: false },
      { id: 'placed-lamp', kind: 'lamp', x: 0.9, y: 0.48, flip: false },
      { id: 'placed-plant', kind: 'plant', x: 0.9, y: 0.74, flip: false },
      { id: 'placed-books', kind: 'bookshelf', x: 0.12, y: 0.46, flip: false },
      { id: 'placed-frame', kind: 'frame', x: 0.22, y: 0.2, flip: false, photo: SAMPLE_FRAME, scale: 1.05 },
      { id: 'placed-gold', kind: 'frame-gold', x: 0.5, y: 0.16, flip: false, photo: SAMPLE_MOON, scale: 0.85 },
      { id: 'placed-polaroid', kind: 'frame-polaroid', x: 0.76, y: 0.28, flip: false, photo: SAMPLE_HOUSE, scale: 1.3 },
      { id: 'placed-easel', kind: 'easel', x: 0.38, y: 0.7, flip: false, drawing: SAMPLE_DRAWING },
      { id: 'placed-plush', kind: 'plush-sprout', x: 0.62, y: 0.84, flip: false },
    ],
  };
}

export function buyTheme(room: PalRoom, coins: number, premium: boolean, themeId: string): { ok: boolean; message: string; room: PalRoom; coins: number } {
  const theme = themeById(themeId);
  if (room.ownedThemes.includes(theme.id)) return { ok: true, message: 'Theme on.', room: { ...room, themeId: theme.id }, coins };
  if (theme.premium && !premium) return { ok: false, message: 'That room is Diary Plus.', room, coins };
  if (coins < theme.price) return { ok: false, message: `You need ${theme.price} coins.`, room, coins };
  return {
    ok: true,
    message: `${theme.name} is on the walls.`,
    room: { ...room, themeId: theme.id, ownedThemes: [...room.ownedThemes, theme.id] },
    coins: coins - theme.price,
  };
}
