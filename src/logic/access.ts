export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Unlock = 'free' | 'coins' | 'premium';

export type Ownable = {
  id: string;
  rarity: Rarity;
  unlock: Unlock;
  price: number;
};

export function coinPrice(rarity: Rarity): number {
  if (rarity === 'common') return 25;
  if (rarity === 'rare') return 80;
  return 0;
}

export function canUseItem(
  item: Ownable,
  wallet: { ownedIds: string[]; premium: boolean },
): boolean {
  if (item.unlock === 'free') return true;
  if (wallet.ownedIds.includes(item.id)) return true;
  if (item.unlock === 'premium' && wallet.premium) return true;
  return false;
}

export function rarityLabel(rarity: Rarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
