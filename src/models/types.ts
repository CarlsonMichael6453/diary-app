import type { MoodId } from '../data/moods';
import type { ColorDesign } from '../theme/designs';
import type { ThemeId } from '../theme/themes';

export type StickerPlacement = {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z?: number;
};

export type PhotoFrame = 'none' | 'polaroid' | 'tape' | 'round';

export type PhotoPlacement = {
  id: string;
  uri: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  frame: PhotoFrame;
  z?: number;
};

export type NoteStyle = 'none' | 'sticky' | 'bubble' | 'tag' | 'torn' | 'highlight';

export type NotePlacement = {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  style: NoteStyle;
  fontId?: string | null;
  inkColor?: string | null;
  z?: number;
};

export type DiaryBook = {
  id: string;
  title: string;
  themeId: ThemeId;
  design?: ColorDesign | null;
  fontId?: string | null;
  inkColor?: string | null;
};

export type DiaryEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: MoodId;
  photos: string[];
  photoPlacements?: PhotoPlacement[];
  notes?: NotePlacement[];
  textZ?: number;
  photoOnly?: boolean;
  stickers: StickerPlacement[];
  themeOverride: ThemeId | null;
  design?: ColorDesign | null;
  fontId?: string | null;
  inkColor?: string | null;
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
  bookOpenMusic: boolean;
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
  fontId: string | null;
  inkColor: string | null;
  /** Hide the buttons and the pal so a page is only for writing. */
  deepWriting: boolean;
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
