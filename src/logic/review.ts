import { REVIEW_COOLDOWN_MS, REVIEW_MAX_PROMPTS, REVIEW_MIN_WRITING_STREAK } from '../config';

export type ReviewMoment = 'launch' | 'entry-saved' | 'game-won';

export type ReviewRecord = {
  lastAskedAt: number | null;
  count: number;
};

export type ReviewReason = 'not-a-positive-moment' | 'streak-too-short' | 'prompt-limit' | 'cooldown' | 'ready';

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
  minWritingStreak?: number;
  cooldownMs?: number;
  maxPrompts?: number;
}): ReviewDecision {
  const minWritingStreak = input.minWritingStreak ?? REVIEW_MIN_WRITING_STREAK;
  const cooldownMs = input.cooldownMs ?? REVIEW_COOLDOWN_MS;
  const maxPrompts = input.maxPrompts ?? REVIEW_MAX_PROMPTS;
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
  minWritingStreak?: number;
  cooldownMs?: number;
  maxPrompts?: number;
}): { decision: ReviewDecision; next: ReviewRecord } {
  const decision = shouldAskForReview(input);
  if (!decision.ask) return { decision, next: input.record };
  return { decision, next: recordReviewAsk(input.record, input.now) };
}
