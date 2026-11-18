import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { canEquipOutfit, getOutfit } from '../buddies/catalog';
import { addDays, todayKey } from '../logic/dates';
import { uid } from '../logic/id';
import { LOGIN_REWARDS, resolveReward, streakOutfitIds, writingBonus, type ResolvedReward } from '../logic/rewards';
import { loginProgress } from '../logic/streak';
import { writingStreak } from '../logic/streak';
import type { DiaryEntry, Settings, Snapshot, Wallet } from '../models/types';
import { getProduct } from '../services/purchases';
import { STICKERS, getSticker } from '../stickers/catalog';
import type { ThemeId } from '../theme/themes';

export type DiaryData = {
  settings: Settings;
  entries: DiaryEntry[];
  wallet: Wallet;
};

function seedEntries(): DiaryEntry[] {
  const today = todayKey();
  const free = STICKERS.filter((sticker) => sticker.unlock === 'free');
  const place = (index: number, x: number, y: number, rotation: number) => {
    const sticker = free[index];
    if (!sticker) return [];
    return [{ id: uid('stk'), stickerId: sticker.id, x, y, scale: 0.95, rotation }];
  };
  const page = (partial: Omit<DiaryEntry, 'photos' | 'createdAt' | 'updatedAt' | 'sample'> & { photos?: string[] }): DiaryEntry => ({
    photos: partial.photos ?? [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sample: true,
    ...partial,
  });
  return [
    page({
      id: 'sample-home',
      date: addDays(today, -1),
      title: 'The long way home',
      body: 'I took the street with the trees even though it was longer. The light was doing that late-afternoon thing where everything looks forgiven.',
      mood: 'grateful',
      stickers: place(0, 0.82, 0.62, -8),
      themeOverride: null,
    }),
    page({
      id: 'sample-rain',
      date: addDays(today, -2),
      title: 'Rain on the window',
      body: 'Worked at the table while the glass went silver. I did not solve anything. I did drink the tea while it was still hot.',
      mood: 'calm',
      stickers: place(2, 0.18, 0.72, 6),
      themeOverride: 'ocean',
    }),
    page({
      id: 'sample-room',
      date: addDays(today, -4),
      title: 'A page with room',
      body: 'Left the bottom half blank on purpose. Not every day needs to be filled to the edge to count.',
      mood: 'hopeful',
      stickers: place(4, 0.72, 0.62, 4),
      themeOverride: 'cottagecore',
    }),
    page({
      id: 'sample-good',
      date: addDays(today, -6),
      title: 'Small good things',
      body: 'A song in the kitchen. A text that was only a joke. The feeling of starting a book that is actually mine.',
      mood: 'happy',
      stickers: place(5, 0.24, 0.58, -12),
      themeOverride: null,
    }),
  ];
}

export function defaultSettings(): Settings {
  return {
    bookTitle: "Michael's Diary",
    ownerName: 'Michael',
    themeId: 'cutesy',
    reminderEnabled: true,
    reminderHour: 20,
    reminderMinute: 30,
    lockEnabled: false,
    biometricsEnabled: false,
    buddyId: 'mochi',
    outfitIds: ['ribbon'],
    dismissedNudgeDate: null,
  };
}

function defaultWallet(): Wallet {
  return {
    coins: 60,
    ownedStickerIds: STICKERS.filter((sticker) => sticker.unlock === 'free').map((sticker) => sticker.id),
    ownedOutfitIds: ['ribbon'],
    premium: false,
    loginStreak: 0,
    lastLoginDate: null,
    writingBonusDates: [],
    lastSpinDate: null,
    dropDates: {},
    purchases: [],
  };
}

function initialData(): DiaryData {
  return { settings: defaultSettings(), entries: seedEntries(), wallet: defaultWallet() };
}

type Result = { ok: true; message?: string; reward?: ResolvedReward; bonus?: number } | { ok: false; message: string };

type DiaryStore = DiaryData & {
  upsertEntry: (entry: DiaryEntry) => number;
  deleteEntry: (id: string) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setBuddy: (buddyId: string) => void;
  toggleOutfit: (outfitId: string) => Result;
  buySticker: (stickerId: string) => Result;
  buyOutfit: (outfitId: string) => Result;
  grantReward: (reward: ResolvedReward, game?: 'memory' | 'catch') => void;
  claimLogin: () => Result;
  markSpin: (date: string) => void;
  applyPurchase: (productId: string) => Result;
  restorePremium: () => boolean;
  removeSamples: () => void;
  dismissNudge: (date: string) => void;
  importSnapshot: (raw: unknown) => Result;
  resetBook: () => void;
  snapshot: () => Snapshot;
};

function asSnapshot(value: unknown): Snapshot | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Snapshot;
  if (record.version !== 1 || !record.settings || !record.wallet || !Array.isArray(record.entries)) return null;
  return record;
}

export const useDiary = create<DiaryStore>()(
  persist(
    (set, get) => ({
      ...initialData(),
      upsertEntry: (entry) => {
        let bonus = 0;
        set((state) => {
          const exists = state.entries.some((item) => item.id === entry.id);
          const entries = exists ? state.entries.map((item) => (item.id === entry.id ? entry : item)) : [entry, ...state.entries];
          let wallet = state.wallet;
          if (!wallet.writingBonusDates.includes(entry.date)) {
            const streak = writingStreak(entries.map((item) => item.date));
            bonus = writingBonus(streak);
            const outfits = streakOutfitIds(streak);
            wallet = {
              ...wallet,
              coins: wallet.coins + bonus,
              writingBonusDates: [...wallet.writingBonusDates, entry.date],
              ownedOutfitIds: Array.from(new Set([...wallet.ownedOutfitIds, ...outfits])),
            };
          }
          return { entries, wallet };
        });
        return bonus;
      },
      deleteEntry: (id) => set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) })),
      patchSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      setBuddy: (buddyId) => set((state) => ({ settings: { ...state.settings, buddyId } })),
      toggleOutfit: (outfitId) => {
        const outfit = getOutfit(outfitId);
        const { settings, wallet } = get();
        if (!outfit) return { ok: false, message: 'That accessory does not exist.' };
        if (!canEquipOutfit(outfit, wallet)) return { ok: false, message: outfit.hint };
        const equipped = settings.outfitIds.includes(outfitId);
        const next = equipped
          ? settings.outfitIds.filter((id) => id !== outfitId)
          : [...settings.outfitIds.filter((id) => getOutfit(id)?.slot !== outfit.slot), outfitId];
        set({ settings: { ...settings, outfitIds: next } });
        return { ok: true, message: equipped ? `Put away the ${outfit.name}.` : `${outfit.name} is on.` };
      },
      buySticker: (stickerId) => {
        const sticker = getSticker(stickerId);
        const wallet = get().wallet;
        if (!sticker || sticker.unlock !== 'coins') return { ok: false, message: 'This one is not sold for coins.' };
        if (wallet.ownedStickerIds.includes(sticker.id)) return { ok: false, message: 'Already in the album.' };
        if (wallet.coins < sticker.price) return { ok: false, message: `You need ${sticker.price} coins.` };
        set({
          wallet: {
            ...wallet,
            coins: wallet.coins - sticker.price,
            ownedStickerIds: [...wallet.ownedStickerIds, sticker.id],
          },
        });
        return { ok: true, message: `${sticker.name} is yours.` };
      },
      buyOutfit: (outfitId) => {
        const outfit = getOutfit(outfitId);
        const wallet = get().wallet;
        if (!outfit || outfit.unlock !== 'coins' || !outfit.price) return { ok: false, message: 'This one is not for sale.' };
        if (wallet.ownedOutfitIds.includes(outfit.id)) return { ok: false, message: 'Already in the wardrobe.' };
        if (wallet.coins < outfit.price) return { ok: false, message: `You need ${outfit.price} coins.` };
        set({
          wallet: {
            ...wallet,
            coins: wallet.coins - outfit.price,
            ownedOutfitIds: [...wallet.ownedOutfitIds, outfit.id],
          },
        });
        return { ok: true, message: `${outfit.name} is in the wardrobe.` };
      },
      grantReward: (reward, game) =>
        set((state) => {
          const ownedStickerIds = reward.stickerId
            ? Array.from(new Set([...state.wallet.ownedStickerIds, reward.stickerId]))
            : state.wallet.ownedStickerIds;
          const ownedOutfitIds = reward.outfitId
            ? Array.from(new Set([...state.wallet.ownedOutfitIds, reward.outfitId]))
            : state.wallet.ownedOutfitIds;
          const dropDates = game ? { ...state.wallet.dropDates, [game]: todayKey() } : state.wallet.dropDates;
          return {
            wallet: {
              ...state.wallet,
              coins: state.wallet.coins + reward.coins,
              ownedStickerIds,
              ownedOutfitIds,
              dropDates,
            },
          };
        }),
      claimLogin: () => {
        const today = todayKey();
        const wallet = get().wallet;
        const progress = loginProgress(wallet.lastLoginDate, wallet.loginStreak, today);
        if (progress.claimed) return { ok: false, message: 'Today’s visit gift is already open.' };
        const draft = LOGIN_REWARDS[progress.dayIndex];
        const reward = resolveReward(draft, STICKERS, wallet.ownedStickerIds, wallet.ownedOutfitIds);
        set({
          wallet: {
            ...wallet,
            coins: wallet.coins + reward.coins,
            loginStreak: progress.nextStreak,
            lastLoginDate: today,
            ownedStickerIds: reward.stickerId ? [...wallet.ownedStickerIds, reward.stickerId] : wallet.ownedStickerIds,
            ownedOutfitIds: reward.outfitId ? [...wallet.ownedOutfitIds, reward.outfitId] : wallet.ownedOutfitIds,
          },
        });
        return { ok: true, reward, message: reward.detail };
      },
      markSpin: (date) => set((state) => ({ wallet: { ...state.wallet, lastSpinDate: date } })),
      applyPurchase: (productId) => {
        const product = getProduct(productId);
        if (!product) return { ok: false, message: 'Unknown product.' };
        const wallet = get().wallet;
        set({
          wallet: {
            ...wallet,
            premium: product.kind === 'premium' ? true : wallet.premium,
            coins: wallet.coins + (product.coins ?? 0),
            purchases: [...wallet.purchases, { productId, at: Date.now(), mock: true }],
          },
        });
        return { ok: true, message: product.kind === 'premium' ? 'Diary Plus is unlocked on this device.' : `${product.coins} coins added.` };
      },
      restorePremium: () => {
        const wallet = get().wallet;
        const premium = wallet.purchases.some((purchase) => getProduct(purchase.productId)?.kind === 'premium') || wallet.premium;
        if (premium && !wallet.premium) set({ wallet: { ...wallet, premium: true } });
        return premium;
      },
      removeSamples: () => set((state) => ({ entries: state.entries.filter((entry) => !entry.sample) })),
      dismissNudge: (date) => set((state) => ({ settings: { ...state.settings, dismissedNudgeDate: date } })),
      importSnapshot: (raw) => {
        const snapshot = asSnapshot(raw);
        if (!snapshot) return { ok: false, message: 'That file is not a Diary App backup.' };
        set({
          settings: { ...defaultSettings(), ...snapshot.settings },
          entries: snapshot.entries,
          wallet: { ...defaultWallet(), ...snapshot.wallet },
        });
        return { ok: true, message: 'Backup restored on this device.' };
      },
      resetBook: () => set(initialData()),
      snapshot: () => {
        const { settings, entries, wallet } = get();
        return { version: 1, exportedAt: new Date().toISOString(), settings, entries, wallet };
      },
    }),
    {
      name: 'diary-app-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ settings: state.settings, entries: state.entries, wallet: state.wallet }),
    },
  ),
);

export function useHydrated(): boolean {
  const [ready, setReady] = useState(useDiary.persist.hasHydrated());
  useEffect(() => {
    const unsub = useDiary.persist.onFinishHydration(() => setReady(true));
    if (useDiary.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);
  return ready;
}

export function entriesOn(entries: DiaryEntry[], date: string): DiaryEntry[] {
  return entries.filter((entry) => entry.date === date).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function setTheme(themeId: ThemeId) {
  useDiary.getState().patchSettings({ themeId });
}
