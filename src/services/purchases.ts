/**
 * Purchase boundary.
 *
 * The app ships with a mock provider so the paywall, restore flow, and
 * entitlement rules can be exercised without a store account.
 *
 * To plug in RevenueCat later:
 * 1. Add `react-native-purchases`.
 * 2. Implement `PurchaseProvider` with Purchases.configure / getOfferings / purchasePackage.
 * 3. Return that provider from `getPurchaseProvider()` when
 *    `EXPO_PUBLIC_REVENUECAT_KEY` is present. Keep this mock for web and tests.
 */

export type Product = {
  id: string;
  title: string;
  priceLabel: string;
  detail: string;
  kind: 'premium' | 'coins';
  coins?: number;
};

export type PurchaseResult = { ok: true; productId: string; mock: boolean } | { ok: false; message: string };

export interface PurchaseProvider {
  readonly mode: 'mock' | 'revenuecat';
  getProducts(): readonly Product[];
  purchase(productId: string): Promise<PurchaseResult>;
  restore(ownedProductIds: string[]): Promise<{ premium: boolean }>;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'plus_lifetime',
    title: 'Diary Plus · Lifetime',
    priceLabel: '$24.99',
    detail: 'Every premium sticker pack, Ember, Lumi, and the foil wardrobe.',
    kind: 'premium',
  },
  {
    id: 'plus_monthly',
    title: 'Diary Plus · Monthly',
    priceLabel: '$3.99',
    detail: 'The same collection, ready for a real subscription later.',
    kind: 'premium',
  },
  {
    id: 'coins_pouch',
    title: 'Coin pouch',
    priceLabel: '$0.99',
    detail: '150 coins for common and rare stickers.',
    kind: 'coins',
    coins: 150,
  },
  {
    id: 'coins_jar',
    title: 'Coin jar',
    priceLabel: '$4.99',
    detail: '900 coins. A serious sticker budget.',
    kind: 'coins',
    coins: 900,
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockProvider: PurchaseProvider = {
  mode: 'mock',
  getProducts: () => PRODUCTS,
  async purchase(productId: string) {
    await wait(700);
    if (!PRODUCTS.some((product) => product.id === productId)) {
      return { ok: false, message: 'That product is not in the catalog.' };
    }
    return { ok: true, productId, mock: true };
  },
  async restore(ownedProductIds: string[]) {
    await wait(400);
    const premium = ownedProductIds.some((id) => PRODUCTS.find((product) => product.id === id)?.kind === 'premium');
    return { premium };
  },
};

export function getPurchaseProvider(): PurchaseProvider {
  return mockProvider;
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
