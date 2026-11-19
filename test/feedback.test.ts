import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { FEEDBACK_EMAIL, isFeedbackConfigured } from '../src/config';
import { buildFeedbackPayload, feedbackMailUrl, feedbackMessageBody, feedbackPlatform } from '../src/logic/feedback';

const DIARY = {
  entries: [
    {
      title: 'UNIQUE_TITLE_zz',
      body: 'UNIQUE_BODY_zz',
      mood: 'UNIQUE_MOOD_zz',
      photos: ['UNIQUE_PHOTO_zz'],
    },
  ],
  search: 'UNIQUE_SEARCH_zz',
  stickers: [{ stickerId: 'UNIQUE_STICKER_zz', x: 0.2, y: 0.4, rotation: 12 }],
};

const SECRETS = ['UNIQUE_TITLE_zz', 'UNIQUE_BODY_zz', 'UNIQUE_MOOD_zz', 'UNIQUE_PHOTO_zz', 'UNIQUE_SEARCH_zz', 'UNIQUE_STICKER_zz'];

function draft() {
  return {
    rating: 5 as const,
    message: 'The calendar is lovely',
    replyTo: 'reader@mailbox.test',
    appVersion: '1.0.0',
    platform: 'web',
    osVersion: 'test-os',
    ...DIARY,
    title: DIARY.entries[0].title,
    body: DIARY.entries[0].body,
    mood: DIARY.entries[0].mood,
    photos: DIARY.entries[0].photos,
  };
}

describe('feedback payload', () => {
  it('keeps only rating, note, reply-to, version, and device fields', () => {
    const payload = buildFeedbackPayload(draft());
    assert.ok(payload);
    assert.deepEqual(Object.keys(payload).sort(), ['appVersion', 'message', 'osVersion', 'platform', 'rating', 'replyTo']);
    assert.equal(payload.rating, 5);
    assert.equal(payload.message, 'The calendar is lovely');
    assert.equal(payload.replyTo, 'reader@mailbox.test');
    assert.equal(payload.appVersion, '1.0.0');
    assert.equal(payload.platform, 'web');
    assert.equal(payload.osVersion, 'test-os');
  });

  it('never copies diary entries, titles, moods, photos, search terms, or stickers', () => {
    const payload = buildFeedbackPayload(draft());
    assert.ok(payload);
    const blob = `${JSON.stringify(payload)}\n${feedbackMessageBody(payload)}`;
    for (const secret of SECRETS) {
      assert.equal(blob.includes(secret), false, secret);
    }
    const url = feedbackMailUrl('hello@diary.test', payload);
    assert.ok(url);
    const body = decodeURIComponent(url.split('body=')[1] ?? '');
    for (const secret of SECRETS) {
      assert.equal(body.includes(secret), false, secret);
    }
    assert.equal(body.includes('Title:'), false);
    assert.equal(body.includes('Mood:'), false);
    assert.equal(body.includes('Photos:'), false);
    assert.equal(body.includes('Search:'), false);
    assert.equal(body.includes('Sticker'), false);
    assert.match(body, /App version: 1\.0\.0/);
    assert.match(body, /Platform: web/);
    assert.match(body, /OS version: test-os/);
    assert.match(body, /Rating: 5 \/ 5/);
  });

  it('drops non-string extras instead of serializing them into the note', () => {
    const payload = buildFeedbackPayload({
      rating: 'up',
      message: { text: 'UNIQUE_BODY_zz' },
      replyTo: { email: 'UNIQUE_TITLE_zz' },
      appVersion: '1.2.3',
      platform: 'iOS',
      osVersion: '17.5',
      entries: DIARY.entries,
    });
    assert.ok(payload);
    assert.equal(payload.message, '');
    assert.equal(payload.replyTo, '');
    assert.equal(JSON.stringify(payload).includes('UNIQUE_'), false);
    assert.match(feedbackMessageBody(payload), /Rating: thumbs up/);
    assert.match(feedbackMessageBody(payload), /Reply-to: \(not provided\)/);
  });

  it('flattens a reply-to onto one line and ignores an unknown rating', () => {
    const payload = buildFeedbackPayload({
      rating: 'down',
      message: 'A note',
      replyTo: 'me@test.co\nTitle: UNIQUE_TITLE_zz',
      appVersion: '1.0.0',
      platform: 'Android',
      osVersion: '14',
    });
    assert.ok(payload);
    assert.equal(payload.replyTo.includes('\n'), false);
    assert.equal(buildFeedbackPayload({ ...draft(), rating: 'maybe' }), null);
  });

  it('does not open mail while the inbox is still the placeholder', () => {
    const payload = buildFeedbackPayload(draft());
    assert.ok(payload);
    assert.equal(isFeedbackConfigured('feedback@example.com'), false);
    assert.equal(isFeedbackConfigured('  Feedback@Example.com '), false);
    assert.equal(isFeedbackConfigured(''), false);
    assert.equal(isFeedbackConfigured('not-an-email'), false);
    assert.equal(feedbackMailUrl('feedback@example.com', payload), null);
    assert.equal(feedbackMailUrl(FEEDBACK_EMAIL, payload) === null, !isFeedbackConfigured(FEEDBACK_EMAIL));
    const url = feedbackMailUrl('hello@diary.test', payload);
    assert.ok(url?.startsWith('mailto:hello@diary.test?'));
    assert.equal(url?.includes('feedback@example.com'), false);
  });

  it('names web, iOS, and Android', () => {
    assert.equal(feedbackPlatform('web'), 'web');
    assert.equal(feedbackPlatform('ios'), 'iOS');
    assert.equal(feedbackPlatform('android'), 'Android');
  });

  it('the feedback screen does not read the diary store', () => {
    const source = readFileSync(new URL('../app/feedback.tsx', import.meta.url), 'utf8');
    const logic = readFileSync(new URL('../src/logic/feedback.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('useDiary'), false);
    assert.equal(source.includes('src/store'), false);
    assert.equal(source.includes('src/data/moods'), false);
    assert.equal(logic.includes('useDiary'), false);
    assert.equal(logic.includes('DiaryEntry'), false);
  });
});
