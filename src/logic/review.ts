import { REVIEW_COOLDOWN_MS, REVIEW_MAX_PROMPTS, REVIEW_MIN_SAVED_ENTRIES, REVIEW_MIN_WRITING_STREAK } from '../config';

export type ReviewMoment = 'launch' | 'entry-saved' | 'game-won';

export type ReviewRecord = {
  lastAskedAt: number | null;
  count: number;
};

export type ReviewReason = 'not-enough-entries' | 'not-a-positive-moment' | 'streak-too-short' | 'prompt-limit' | 'cooldown' | 'ready';

/** A page the user actually kept: writing, a photo, a sticker, a note, a voice note, or a drawing. Samples and blanks do not count. */
export function entryCountsForReview(entry: {
  sample?: boolean;
  title?: string;
  body?: string;
  photos?: string[];
  photoPlacements?: unknown[];
  stickers?: unknown[];
  notes?: unknown[];
  photoOnly?: boolean;
  voiceNote?: string | null;
  drawing?: string | null;
}): boolean {
  if (entry.sample) return false;
  if (entry.title?.trim()) return true;
  if (entry.body?.trim()) return true;
  if ((entry.photos?.length ?? 0) > 0) return true;
  if ((entry.photoPlacements?.length ?? 0) > 0) return true;
  if ((entry.stickers?.length ?? 0) > 0) return true;
  if ((entry.notes?.length ?? 0) > 0) return true;
  if (entry.photoOnly) return true;
  if (entry.voiceNote) return true;
  if (entry.drawing) return true;
  return false;
}

export function countReviewEntries(entries: Array<Parameters<typeof entryCountsForReview>[0]>): number {
  return entries.filter(entryCountsForReview).length;
}

export type ReviewDecision = {
  ask: boolean;
  reason: ReviewReason;
};

const EMPTY_RECORD: ReviewRecord = { lastAskedAt: null, count: 0 };

export function normalizeReviewRecord(raw: unknown): ReviewRecord {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_RECORD };
  const value = raw as { lastAskedAt?: unknown; count?: unknown };
  const lastAskedAt = typeof value.lastAskedAt === 'number' && Number.isFinite(value.lastAskedAt) ? value.lastAskedAt : null;
  const count = typeof value.count === 'number' && Number.isFinite(value.count) ? Math.max(0, Math.floor(value.count)) : 0;
  return { lastAskedAt, count };
}

export function shouldAskForReview(input: {
  record: ReviewRecord;
  now: number;
  moment: ReviewMoment;
  writingStreak?: number;
  savedEntryCount?: number;
  minSavedEntries?: number;
  minWritingStreak?: number;
  cooldownMs?: number;
  maxPrompts?: number;
}): ReviewDecision {
  const minWritingStreak = input.minWritingStreak ?? REVIEW_MIN_WRITING_STREAK;
  const minSavedEntries = input.minSavedEntries ?? REVIEW_MIN_SAVED_ENTRIES;
  const cooldownMs = input.cooldownMs ?? REVIEW_COOLDOWN_MS;
  const maxPrompts = input.maxPrompts ?? REVIEW_MAX_PROMPTS;
  if ((input.savedEntryCount ?? 0) < minSavedEntries) {
    return { ask: false, reason: 'not-enough-entries' };
  }
  if (input.moment !== 'entry-saved' && input.moment !== 'game-won') {
    return { ask: false, reason: 'not-a-positive-moment' };
  }
  if (input.moment === 'entry-saved' && (input.writingStreak ?? 0) < minWritingStreak) {
    return { ask: false, reason: 'streak-too-short' };
  }
  if (input.record.count >= maxPrompts) {
    return { ask: false, reason: 'prompt-limit' };
  }
  if (input.record.lastAskedAt != null && input.now - input.record.lastAskedAt < cooldownMs) {
    return { ask: false, reason: 'cooldown' };
  }
  return { ask: true, reason: 'ready' };
}

export function recordReviewAsk(record: ReviewRecord, now: number): ReviewRecord {
  return { lastAskedAt: now, count: record.count + 1 };
}

export function decideReview(input: {
  record: ReviewRecord;
  now: number;
  moment: ReviewMoment;
  writingStreak?: number;
  savedEntryCount?: number;
  minSavedEntries?: number;
  minWritingStreak?: number;
  cooldownMs?: number;
  maxPrompts?: number;
}): { decision: ReviewDecision; next: ReviewRecord } {
  const decision = shouldAskForReview(input);
  if (!decision.ask) return { decision, next: input.record };
  return { decision, next: recordReviewAsk(input.record, input.now) };
}
