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

export type DiaryBook = {
  id: string;
  title: string;
  themeId: ThemeId;
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
  bookId?: string;
  tags?: string[];
  activities?: string[];
  templateId?: string | null;
  voiceNote?: string | null;
  drawing?: string | null;
  placeLabel?: string | null;
  weather?: string | null;
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
  soundEnabled: boolean;
  buddySounds: boolean;
  pageSounds: boolean;
  soundVolume: number;
  lockOnOpen: boolean;
  books: DiaryBook[];
  activeBookId: string;
  lastBackupAt: string | null;
  backupReminderDays: number;
  encryptAtRest: boolean;
  locationOnEntry: boolean;
  weatherOnEntry: boolean;
  healthCorrelation: boolean;
  palNotifications: boolean;
  quietStart: number;
  quietEnd: number;
  lastSayingId: string | null;
  seenWelcome: boolean;
  shakeToOpen: boolean;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  /** YYYY-MM-DD shop preview. Diary pages keep the real date. */
  debugDate: string | null;
  seasonAnnounced: string[];
};

export type Wallet = {
  coins: number;
  ownedStickerIds: string[];
  ownedPackIds: string[];
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
  version: 1 | 2;
  exportedAt: string;
  settings: Settings;
  entries: DiaryEntry[];
  wallet: Wallet;
  books?: DiaryBook[];
};
