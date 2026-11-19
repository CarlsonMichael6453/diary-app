import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { REVIEW_COOLDOWN_DAYS, REVIEW_COOLDOWN_MS, REVIEW_MAX_PROMPTS, REVIEW_MIN_WRITING_STREAK } from '../src/config';
import { decideReview, normalizeReviewRecord, recordReviewAsk, shouldAskForReview, type ReviewRecord } from '../src/logic/review';

const fresh: ReviewRecord = { lastAskedAt: null, count: 0 };

describe('store review cooldown', () => {
  it('stores the product thresholds in config', () => {
    assert.equal(REVIEW_MIN_WRITING_STREAK, 3);
    assert.equal(REVIEW_COOLDOWN_DAYS, 90);
    assert.equal(REVIEW_COOLDOWN_MS, 90 * 24 * 60 * 60 * 1000);
    assert.equal(REVIEW_MAX_PROMPTS, 3);
  });

  it('never asks at launch, even after a long streak', () => {
    const outcome = decideReview({ record: fresh, now: 50, moment: 'launch', writingStreak: 40 });
    assert.equal(outcome.decision.ask, false);
    assert.equal(outcome.decision.reason, 'not-a-positive-moment');
    assert.deepEqual(outcome.next, fresh);
    assert.equal(shouldAskForReview({ record: fresh, now: 50, moment: 'launch' }).ask, false);
  });

  it('asks after a saved entry only once the writing streak reaches the threshold', () => {
    const short = decideReview({
      record: fresh,
      now: 10,
      moment: 'entry-saved',
      writingStreak: REVIEW_MIN_WRITING_STREAK - 1,
    });
    assert.equal(short.decision.reason, 'streak-too-short');
    assert.equal(short.decision.ask, false);
    assert.deepEqual(short.next, fresh);

    const ready = decideReview({
      record: fresh,
      now: 10,
      moment: 'entry-saved',
      writingStreak: REVIEW_MIN_WRITING_STREAK,
    });
    assert.equal(ready.decision.ask, true);
    assert.deepEqual(ready.next, { lastAskedAt: 10, count: 1 });
    assert.equal(fresh.count, 0);
  });

  it('asks after a game win without a writing streak', () => {
    const outcome = decideReview({ record: fresh, now: 5, moment: 'game-won', writingStreak: 0 });
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
    });
    assert.equal(tooSoon.decision.ask, false);
    assert.equal(tooSoon.decision.reason, 'cooldown');
    assert.equal(tooSoon.next.count, 1);

    const later = decideReview({
      record: asked,
      now: 1_000 + REVIEW_COOLDOWN_MS,
      moment: 'entry-saved',
      writingStreak: 3,
    });
    assert.equal(later.decision.ask, true);
    assert.equal(later.next.count, 2);
    assert.equal(later.next.lastAskedAt, 1_000 + REVIEW_COOLDOWN_MS);
  });

  it('stops after three asks even when the cooldown has long passed', () => {
    let record = fresh;
    const asks: boolean[] = [];
    for (let n = 0; n < 4; n += 1) {
      const outcome = decideReview({ record, now: n * REVIEW_COOLDOWN_MS, moment: 'game-won' });
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
    });
    assert.equal(muchLater.ask, false);
    assert.equal(muchLater.reason, 'prompt-limit');
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
