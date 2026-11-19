import { isFeedbackConfigured } from '../config';

/** Thumbs or a 1–5 star rating. Diary fields are not part of this type. */
export type FeedbackRating = 'up' | 'down' | 1 | 2 | 3 | 4 | 5;

export type FeedbackPayload = {
  rating: FeedbackRating;
  message: string;
  replyTo: string;
  appVersion: string;
  platform: string;
  osVersion: string;
};

export type FeedbackDraftInput = {
  rating: unknown;
  message?: unknown;
  replyTo?: unknown;
  appVersion?: unknown;
  platform?: unknown;
  osVersion?: unknown;
  [extra: string]: unknown;
};

const RATINGS = new Set<FeedbackRating>(['up', 'down', 1, 2, 3, 4, 5]);

export function isFeedbackRating(value: unknown): value is FeedbackRating {
  return typeof value === 'string' || typeof value === 'number' ? RATINGS.has(value as FeedbackRating) : false;
}

function asMessage(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asSingleLine(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Copies only the feedback fields. Extra keys (entries, titles, moods, photos,
 * search terms, sticker data, or anything else) are dropped on the floor.
 */
export function buildFeedbackPayload(input: FeedbackDraftInput): FeedbackPayload | null {
  if (!isFeedbackRating(input.rating)) return null;
  return {
    rating: input.rating,
    message: asMessage(input.message),
    replyTo: asSingleLine(input.replyTo),
    appVersion: asSingleLine(input.appVersion),
    platform: asSingleLine(input.platform),
    osVersion: asSingleLine(input.osVersion),
  };
}

export function formatFeedbackRating(rating: FeedbackRating): string {
  if (rating === 'up') return 'thumbs up';
  if (rating === 'down') return 'thumbs down';
  return `${rating} / 5`;
}

export function feedbackMessageBody(payload: FeedbackPayload): string {
  return [
    `Rating: ${formatFeedbackRating(payload.rating)}`,
    '',
    payload.message ? payload.message : '(no written note)',
    '',
    `Reply-to: ${payload.replyTo || '(not provided)'}`,
    '',
    `App version: ${payload.appVersion}`,
    `Platform: ${payload.platform}`,
    `OS version: ${payload.osVersion}`,
  ].join('\n');
}

/** Returns null when the inbox is still the placeholder, so the caller does not open a mail link. */
export function feedbackMailUrl(email: string, payload: FeedbackPayload): string | null {
  if (!isFeedbackConfigured(email)) return null;
  const subject = 'Diary App feedback';
  const body = feedbackMessageBody(payload);
  return `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function feedbackPlatform(os: string): 'web' | 'iOS' | 'Android' {
  if (os === 'ios') return 'iOS';
  if (os === 'android') return 'Android';
  return 'web';
}
