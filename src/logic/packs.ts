import type { PackDef } from '../stickers/types';

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
  if (offer.kind === 'premium' && premium) return true;
  return false;
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
