import { goodsById, themeById, type RoomGoods } from './catalog';

export type PlacedItem = {
  id: string;
  kind: string;
  x: number;
  y: number;
  flip: boolean;
  photo?: string | null;
  drawing?: string | null;
};

export type PalRoom = {
  themeId: string;
  ownedThemes: string[];
  ownedKinds: string[];
  items: PlacedItem[];
};

export function clampSpot(value: number): number {
  return Math.min(0.9, Math.max(0.1, value));
}

export function moveItem(room: PalRoom, id: string, x: number, y: number): PalRoom {
  return { ...room, items: room.items.map((item) => (item.id === id ? { ...item, x: clampSpot(x), y: clampSpot(y) } : item)) };
}

export function flipItem(room: PalRoom, id: string): PalRoom {
  return { ...room, items: room.items.map((item) => (item.id === id ? { ...item, flip: !item.flip } : item)) };
}

export function removeItem(room: PalRoom, id: string): PalRoom {
  return { ...room, items: room.items.filter((item) => item.id !== id) };
}

export function patchItem(room: PalRoom, id: string, patch: Partial<Pick<PlacedItem, 'photo' | 'drawing'>>): PalRoom {
  return { ...room, items: room.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) };
}

export function placeItem(room: PalRoom, kind: string, id: string): PalRoom {
  if (!room.ownedKinds.includes(kind)) return room;
  return { ...room, items: [...room.items, { id, kind, x: 0.5, y: 0.62, flip: false }] };
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

export const SAMPLE_DRAWING = JSON.stringify([{ points: '8,40 20,16 32,40 46,14 60,40', color: '#E85D4C', size: 3, space: 'pad' }]);

export function defaultRoom(): PalRoom {
  return {
    themeId: 'cottage',
    ownedThemes: ['cottage', 'library'],
    ownedKinds: ['rug', 'bed', 'armchair', 'lamp', 'plant', 'bookshelf', 'frame', 'easel', 'catbed', 'poster', 'plush-sprout', 'plush-mochi'],
    items: [
      { id: 'placed-rug', kind: 'rug', x: 0.5, y: 0.82, flip: false },
      { id: 'placed-bed', kind: 'bed', x: 0.28, y: 0.64, flip: false },
      { id: 'placed-chair', kind: 'armchair', x: 0.74, y: 0.62, flip: false },
      { id: 'placed-lamp', kind: 'lamp', x: 0.16, y: 0.48, flip: false },
      { id: 'placed-plant', kind: 'plant', x: 0.88, y: 0.7, flip: false },
      { id: 'placed-books', kind: 'bookshelf', x: 0.14, y: 0.4, flip: false },
      { id: 'placed-frame', kind: 'frame', x: 0.62, y: 0.28, flip: false, photo: SAMPLE_FRAME },
      { id: 'placed-easel', kind: 'easel', x: 0.84, y: 0.46, flip: false, drawing: SAMPLE_DRAWING },
      { id: 'placed-plush', kind: 'plush-sprout', x: 0.46, y: 0.78, flip: false },
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
