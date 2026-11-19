import type { Birthday } from './seasons';
import { isSeasonalPack, packOnSale, shopToday } from './seasons';
import { STICKERS } from '../stickers/catalog';
import type { PackDef, StickerDef } from '../stickers/types';

export type PackOffer = { kind: 'free' | 'coins' | 'premium'; coins: number };

export function packOffer(pack: PackDef): PackOffer {
  if (pack.premium) return { kind: 'premium', coins: 0 };
  if (pack.coinPrice && pack.coinPrice > 0) return { kind: 'coins', coins: pack.coinPrice };
  if (pack.id === 'spark' || pack.id === 'desk') return { kind: 'free', coins: 0 };
  return { kind: 'coins', coins: 80 };
}

export function packIsOwned(pack: PackDef, ownedPackIds: string[], premium: boolean): boolean {
  const offer = packOffer(pack);
  if (offer.kind === 'free') return true;
  if (ownedPackIds.includes(pack.id)) return true;
  if (offer.kind === 'premium' && premium && !pack.seasonal) return true;
  return false;
}

/** Year-round packs, plus seasonal packs you own or that are in the shop today. */
export function packIsListed(pack: PackDef, ownedPackIds: string[], today: string, birthday: Birthday | null): boolean {
  if (ownedPackIds.includes(pack.id)) return true;
  if (pack.hidden) return false;
  if (!pack.seasonal) return true;
  return packOnSale(pack.id, today, birthday);
}

/** Game and login rewards can earn a seasonal sticker only while its pack is in the shop. */
export function earnableStickers(today: string, birthday: Birthday | null): StickerDef[] {
  return STICKERS.filter((sticker) => !isSeasonalPack(sticker.packId) || packOnSale(sticker.packId, today, birthday));
}

export function rewardPoolFor(debugDate: string | null | undefined, birthday: Birthday | null, now = new Date()): StickerDef[] {
  return earnableStickers(shopToday(debugDate, now), birthday);
}

export const PACK_EMOJI: Record<string, string> = {
  spark: '✨',
  critters: '🐰',
  girly: '💖',
  goth: '🦇',
  cottage: '🍄',
  rainbow: '🌈',
  y2k: '💿',
  cafe: '🍰',
  academia: '📖',
  ocean: '🐚',
  desk: '📎',
  foil: '👑',
};
