import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { REVIEW_COOLDOWN_DAYS, REVIEW_COOLDOWN_MS, REVIEW_MAX_PROMPTS, REVIEW_MIN_SAVED_ENTRIES, REVIEW_MIN_WRITING_STREAK } from '../src/config';
import { countReviewEntries, decideReview, normalizeReviewRecord, recordReviewAsk, shouldAskForReview, type ReviewRecord } from '../src/logic/review';

const fresh: ReviewRecord = { lastAskedAt: null, count: 0 };

describe('store review cooldown', () => {
  it('stores the product thresholds in config', () => {
    assert.equal(REVIEW_MIN_WRITING_STREAK, 3);
    assert.equal(REVIEW_MIN_SAVED_ENTRIES, 5);
    assert.equal(REVIEW_COOLDOWN_DAYS, 90);
    assert.equal(REVIEW_COOLDOWN_MS, 90 * 24 * 60 * 60 * 1000);
    assert.equal(REVIEW_MAX_PROMPTS, 3);
  });

  it('never asks at launch, even after a long streak', () => {
    const outcome = decideReview({ record: fresh, now: 50, moment: 'launch', writingStreak: 40, savedEntryCount: 5 });
    assert.equal(outcome.decision.ask, false);
    assert.equal(outcome.decision.reason, 'not-a-positive-moment');
    assert.deepEqual(outcome.next, fresh);
    assert.equal(shouldAskForReview({ record: fresh, now: 50, moment: 'launch', savedEntryCount: 5 }).ask, false);
  });

  it('asks after a saved entry only once the writing streak reaches the threshold', () => {
    const short = decideReview({
      record: fresh,
      now: 10,
      moment: 'entry-saved',
      writingStreak: REVIEW_MIN_WRITING_STREAK - 1,
      savedEntryCount: 5,
    });
    assert.equal(short.decision.reason, 'streak-too-short');
    assert.equal(short.decision.ask, false);
    assert.deepEqual(short.next, fresh);

    const ready = decideReview({
      record: fresh,
      now: 10,
      moment: 'entry-saved',
      writingStreak: REVIEW_MIN_WRITING_STREAK,
      savedEntryCount: 5,
    });
    assert.equal(ready.decision.ask, true);
    assert.deepEqual(ready.next, { lastAskedAt: 10, count: 1 });
    assert.equal(fresh.count, 0);
  });

  it('asks after a game win without a writing streak', () => {
    const outcome = decideReview({ record: fresh, now: 5, moment: 'game-won', writingStreak: 0, savedEntryCount: 5 });
    assert.equal(outcome.decision.ask, true);
    assert.equal(outcome.decision.reason, 'ready');
    assert.equal(outcome.next.count, 1);
  });

  it('waits out the cooldown and then allows another ask', () => {
    const asked = recordReviewAsk(fresh, 1_000);
    const tooSoon = decideReview({
      record: asked,
      now: 1_000 + REVIEW_COOLDOWN_MS - 1,
      moment: 'game-won',
      savedEntryCount: 5,
    });
    assert.equal(tooSoon.decision.ask, false);
    assert.equal(tooSoon.decision.reason, 'cooldown');
    assert.equal(tooSoon.next.count, 1);

    const later = decideReview({
      record: asked,
      now: 1_000 + REVIEW_COOLDOWN_MS,
      moment: 'entry-saved',
      writingStreak: 3,
      savedEntryCount: 6,
    });
    assert.equal(later.decision.ask, true);
    assert.equal(later.next.count, 2);
    assert.equal(later.next.lastAskedAt, 1_000 + REVIEW_COOLDOWN_MS);
  });

  it('stops after three asks even when the cooldown has long passed', () => {
    let record = fresh;
    const asks: boolean[] = [];
    for (let n = 0; n < 4; n += 1) {
      const outcome = decideReview({ record, now: n * REVIEW_COOLDOWN_MS, moment: 'game-won', savedEntryCount: 6 });
      asks.push(outcome.decision.ask);
      record = outcome.next;
    }
    assert.deepEqual(asks, [true, true, true, false]);
    assert.equal(record.count, REVIEW_MAX_PROMPTS);
    const muchLater = shouldAskForReview({
      record,
      now: REVIEW_COOLDOWN_MS * 20,
      moment: 'entry-saved',
      writingStreak: 12,
      savedEntryCount: 6,
    });
    assert.equal(muchLater.ask, false);
    assert.equal(muchLater.reason, 'prompt-limit');
  });

  it('waits for five real saved pages on every trigger', () => {
    const moments = ['launch', 'entry-saved', 'game-won'] as const;
    for (const savedEntryCount of [0, 4]) {
      for (const moment of moments) {
        const outcome = decideReview({
          record: fresh,
          now: 20,
          moment,
          writingStreak: 12,
          savedEntryCount,
        });
        assert.equal(outcome.decision.ask, false, `${moment} with ${savedEntryCount}`);
        assert.equal(outcome.decision.reason, 'not-enough-entries');
        assert.deepEqual(outcome.next, fresh);
      }
    }

    const fifth = decideReview({
      record: fresh,
      now: 20,
      moment: 'entry-saved',
      writingStreak: REVIEW_MIN_WRITING_STREAK,
      savedEntryCount: 5,
    });
    assert.equal(fifth.decision.ask, true);
    assert.equal(fifth.next.count, 1);

    const sixth = decideReview({
      record: fifth.next,
      now: 21,
      moment: 'game-won',
      savedEntryCount: 6,
    });
    assert.equal(sixth.decision.ask, false);
    assert.equal(sixth.decision.reason, 'cooldown');
    assert.equal(sixth.next.count, 1);

    const sixthSave = decideReview({
      record: fresh,
      now: 30,
      moment: 'entry-saved',
      writingStreak: REVIEW_MIN_WRITING_STREAK,
      savedEntryCount: 6,
    });
    assert.equal(sixthSave.decision.ask, true);
    assert.equal(sixthSave.next.count, 1);
  });

  it('counts kept pages and skips blanks, samples, and pages that were deleted', () => {
    const kept = { title: 'Hello', body: '', photos: [], stickers: [], notes: [] };
    const entries = [
      kept,
      { ...kept, title: 'Two' },
      { ...kept, title: '', body: 'A paragraph' },
      { ...kept, title: '', photos: ['photo'] },
      { ...kept, title: '', stickers: [{ id: 's' }] },
      { ...kept, title: '', notes: [{ text: '' }] },
      { title: '   ', body: '  ', photos: [], stickers: [], notes: [] },
      { ...kept, title: 'Sample day', sample: true },
    ];
    assert.equal(countReviewEntries([]), 0);
    assert.equal(countReviewEntries(entries.slice(0, 4)), 4);
    assert.equal(countReviewEntries(entries), 6);
    assert.equal(countReviewEntries(entries.filter((entry) => entry.title !== 'Two')), 5);
  });

  it('stores only the timestamp and the count', () => {
    const normalized = normalizeReviewRecord({
      count: 2.8,
      lastAskedAt: 40,
      entries: [{ title: 'UNIQUE_TITLE_zz', body: 'UNIQUE_BODY_zz' }],
      search: 'UNIQUE_SEARCH_zz',
      stickers: ['UNIQUE_STICKER_zz'],
    });
    assert.deepEqual(normalized, { lastAskedAt: 40, count: 2 });
    assert.equal(JSON.stringify(normalized).includes('UNIQUE_'), false);
    assert.deepEqual(normalizeReviewRecord(null), { lastAskedAt: null, count: 0 });
    assert.deepEqual(normalizeReviewRecord({ count: -4, lastAskedAt: 'yesterday' }), { lastAskedAt: null, count: 0 });
  });
});
