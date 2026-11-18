import type { MoodId } from '../data/moods';
import type { ThemeId } from '../theme/themes';

export type StickerPlacement = {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type DiaryEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: MoodId;
  photos: string[];
  stickers: StickerPlacement[];
  themeOverride: ThemeId | null;
  createdAt: number;
  updatedAt: number;
  sample?: boolean;
};

export type Settings = {
  bookTitle: string;
  ownerName: string;
  themeId: ThemeId;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  lockEnabled: boolean;
  biometricsEnabled: boolean;
  buddyId: string;
  outfitIds: string[];
  dismissedNudgeDate: string | null;
};

export type Wallet = {
  coins: number;
  ownedStickerIds: string[];
  ownedOutfitIds: string[];
  premium: boolean;
  loginStreak: number;
  lastLoginDate: string | null;
  writingBonusDates: string[];
  lastSpinDate: string | null;
  dropDates: { memory?: string; catch?: string };
  purchases: { productId: string; at: number; mock: boolean }[];
};

export type Snapshot = {
  version: 1;
  exportedAt: string;
  settings: Settings;
  entries: DiaryEntry[];
  wallet: Wallet;
};
