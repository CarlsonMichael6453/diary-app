import type { Rarity } from './access';

export type RewardDraft = {
  coins: number;
  stickerRarity?: Rarity;
  outfitId?: string;
  title: string;
  detail: string;
};

export type CatalogItem = { id: string; rarity: Rarity; unlock: 'free' | 'coins' | 'premium' };

export type ResolvedReward = {
  coins: number;
  stickerId?: string;
  outfitId?: string;
  title: string;
  detail: string;
};

export const LOGIN_REWARDS: RewardDraft[] = [
  { coins: 10, title: 'Day 1', detail: 'A little welcome pile of coins.' },
  { coins: 15, title: 'Day 2', detail: 'You came back. The jar notices.' },
  { coins: 20, title: 'Day 3', detail: 'Three days of opening the book.' },
  { coins: 10, stickerRarity: 'common', title: 'Day 4', detail: 'A common sticker slipped into your pocket.' },
  { coins: 30, title: 'Day 5', detail: 'A fatter coin day.' },
  { coins: 40, title: 'Day 6', detail: 'Almost a full week of showing up.' },
  { coins: 20, stickerRarity: 'rare', title: 'Day 7', detail: 'A rare sticker for a full week of visits.' },
];

export const SPIN_SEGMENTS: { label: string; color: string; draft: RewardDraft }[] = [
  { label: '10', color: '#F6C445', draft: { coins: 10, title: '10 coins', detail: 'A small spin, a small clink.' } },
  { label: '20', color: '#F29BB3', draft: { coins: 20, title: '20 coins', detail: 'The wheel likes you today.' } },
  { label: 'Sticker', color: '#7DCEB8', draft: { coins: 5, stickerRarity: 'common', title: 'A sticker', detail: 'A common sticker spun loose.' } },
  { label: '30', color: '#8EB6F2', draft: { coins: 30, title: '30 coins', detail: 'Enough for a common sticker, with change.' } },
  { label: 'Rare', color: '#C9A0E8', draft: { coins: 0, stickerRarity: 'rare', title: 'Rare sticker', detail: 'The rare slice. It does not happen often.' } },
  { label: 'Glasses', color: '#F2B56B', draft: { coins: 5, outfitId: 'glasses', title: 'Star glasses', detail: 'Your pal can wear these tonight.' } },
  { label: '15', color: '#F7A8C4', draft: { coins: 15, title: '15 coins', detail: 'A modest, cheerful pile.' } },
  { label: '40', color: '#E7D36A', draft: { coins: 40, title: '40 coins', detail: 'The generous wedge.' } },
];

const MEMORY_OUTFITS = ['bow', 'headphones', 'cape'];
const CATCH_OUTFITS = ['party-hat', 'scarf'];

export function rewardForMemory(moves: number, rng: () => number = Math.random): RewardDraft {
  const coins = Math.max(8, 34 - Math.min(moves, 24));
  const roll = rng();
  if (roll < 0.02) {
    return { coins, stickerRarity: 'epic', title: 'Jackpot match', detail: 'An epic sticker hid under the last pair.' };
  }
  if (roll < 0.14) {
    return { coins, stickerRarity: 'rare', title: 'Sharp memory', detail: 'A rare sticker for a tidy board.' };
  }
  if (roll < 0.42) {
    return { coins, stickerRarity: 'common', title: 'Pair found', detail: 'Coins, and a common sticker.' };
  }
  if (roll < 0.58) {
    const outfitId = MEMORY_OUTFITS[Math.floor(rng() * MEMORY_OUTFITS.length)] ?? 'bow';
    return { coins, outfitId, title: 'Accessory drop', detail: 'Your pal found something to wear.' };
  }
  return { coins, title: 'Coins collected', detail: 'The pairs paid out in coins.' };
}

export function rewardForCatch(score: number, rng: () => number = Math.random): RewardDraft {
  const coins = Math.max(4, Math.round(score * 1.5));
  const roll = rng();
  if (score >= 12 && roll < 0.08) {
    return { coins, stickerRarity: 'rare', title: 'Quick hands', detail: 'A rare sticker fell into the basket.' };
  }
  if (roll < 0.28) {
    return { coins, stickerRarity: 'common', title: 'Caught one', detail: 'A common sticker stuck to your sleeve.' };
  }
  if (score >= 8 && roll < 0.45) {
    const outfitId = CATCH_OUTFITS[Math.floor(rng() * CATCH_OUTFITS.length)] ?? 'party-hat';
    return { coins, outfitId, title: 'Caught an accessory', detail: 'Something wearable tumbled down.' };
  }
  return { coins, title: 'Coins caught', detail: 'You tapped a pocketful of coins.' };
}

export function spinReward(index: number): RewardDraft {
  const segment = SPIN_SEGMENTS[index] ?? SPIN_SEGMENTS[0];
  return segment.draft;
}

export function pickFromPool(items: CatalogItem[], rarity: Rarity, rng: () => number): string | undefined {
  const pool =
    rarity === 'epic'
      ? items.filter((item) => item.rarity === 'epic')
      : items.filter((item) => item.rarity === rarity && item.unlock !== 'premium');
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length)]?.id;
}

export function resolveReward(
  draft: RewardDraft,
  items: CatalogItem[],
  ownedStickerIds: string[],
  ownedOutfitIds: string[],
  rng: () => number = Math.random,
): ResolvedReward {
  let coins = draft.coins;
  let stickerId = draft.stickerRarity ? pickFromPool(items, draft.stickerRarity, rng) : undefined;
  let outfitId = draft.outfitId;
  let detail = draft.detail;
  if (stickerId && ownedStickerIds.includes(stickerId)) {
    coins += 15;
    detail = 'You already had that sticker, so the book paid extra coins.';
    stickerId = undefined;
  }
  if (outfitId && ownedOutfitIds.includes(outfitId)) {
    coins += 12;
    detail = 'You already own that accessory. Coins instead.';
    outfitId = undefined;
  }
  if (draft.stickerRarity && !stickerId && !detail.includes('already')) {
    coins += 10;
    detail = 'The sticker pile was empty, so you got coins.';
  }
  return { coins, stickerId, outfitId, title: draft.title, detail };
}

export function writingBonus(streak: number): number {
  let bonus = 5;
  if (streak >= 3) bonus += 10;
  if (streak >= 7) bonus += 25;
  if (streak >= 14) bonus += 40;
  if (streak >= 30) bonus += 80;
  return bonus;
}

export function streakOutfitIds(streak: number): string[] {
  const ids: string[] = [];
  if (streak >= 3) ids.push('crown-flower');
  if (streak >= 7) ids.push('moon-pin');
  return ids;
}
