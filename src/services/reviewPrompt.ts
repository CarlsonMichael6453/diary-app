import AsyncStorage from '@react-native-async-storage/async-storage';

import { decideReview, normalizeReviewRecord, type ReviewMoment, type ReviewRecord } from '../logic/review';

const STORAGE_KEY = 'diary-app-review-prompt';

let tail: Promise<unknown> = Promise.resolve();

async function loadReviewRecord(): Promise<ReviewRecord> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastAskedAt: null, count: 0 };
    return normalizeReviewRecord(JSON.parse(raw));
  } catch {
    return { lastAskedAt: null, count: 0 };
  }
}

async function saveReviewRecord(record: ReviewRecord): Promise<void> {
  const stored: ReviewRecord = { lastAskedAt: record.lastAskedAt, count: record.count };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

async function offerReviewOnce(moment: ReviewMoment, writingStreak: number | undefined, now: number): Promise<boolean> {
  const record = await loadReviewRecord();
  const outcome = decideReview({ record, now, moment, writingStreak });
  if (!outcome.decision.ask) return false;
  await saveReviewRecord(outcome.next);
  return true;
}

/** Resolves true only when a prompt should be shown. Calls are serialized so two saves cannot double-count. */
export function offerReview(moment: ReviewMoment, writingStreak?: number, now = Date.now()): Promise<boolean> {
  const run = tail.then(() => offerReviewOnce(moment, writingStreak, now));
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
