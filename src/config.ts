/**
 * Inbox for Send feedback. The mailto link is built only from this value.
 *
 * TODO: Change FEEDBACK_EMAIL before you rely on feedback.
 * `feedback@example.com` is a placeholder, not a real inbox. While it is still
 * set, the form says feedback is not configured and does not open a mail link.
 */
export const FEEDBACK_EMAIL = 'feedback@example.com';

const FEEDBACK_EMAIL_PLACEHOLDER = 'feedback@example.com';

export const REVIEW_MIN_WRITING_STREAK = 3;
export const REVIEW_COOLDOWN_DAYS = 90;
export const REVIEW_COOLDOWN_MS = REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
export const REVIEW_MAX_PROMPTS = 3;

export function isFeedbackConfigured(email: string = FEEDBACK_EMAIL): boolean {
  const value = email.trim().toLowerCase();
  return value.includes('@') && value !== FEEDBACK_EMAIL_PLACEHOLDER;
}
