/** Horizontal page turns should win only after the gesture is clearly sideways. */
export function claimHorizontalSwipe(dx: number, dy: number, editing: boolean): boolean {
  'worklet';
  if (editing) return false;
  if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return false;
  return Math.abs(dx) > Math.abs(dy) + 8;
}

/** A light swipe or a modest flick finishes the turn. A blocked edge never commits. */
export const CURL_COMMIT = 0.18;
export const CURL_FLING = 280;

/**
 * Once a curl is active, release commits past about 18% revealed or on a modest fling.
 * Where the finger is when it lifts wins. A fling only finishes a shorter drag.
 * A blocked edge (no neighbor) never commits. velocityX is pixels per second.
 */
export function releaseCurl(direction: 'next' | 'prev', reveal: number, velocityX: number, blocked: boolean): 'commit' | 'cancel' {
  'worklet';
  if (blocked) return 'cancel';
  if (reveal >= CURL_COMMIT) return 'commit';
  if (direction === 'next' && velocityX <= -CURL_FLING) return 'commit';
  if (direction === 'prev' && velocityX >= CURL_FLING) return 'commit';
  return 'cancel';
}

const COMMIT = CURL_COMMIT;
const FLING = CURL_FLING;

/**
 * Negative progress is a swipe toward the next page.
 * Past about 18% of the width commits. A modest fling commits a shorter drag.
 * velocityX is pixels per second.
 */
export function releaseSwipe(progress: number, velocityX = 0): 'next' | 'prev' | 'cancel' {
  if (progress <= -COMMIT) return 'next';
  if (progress >= COMMIT) return 'prev';
  if (velocityX <= -FLING) return 'next';
  if (velocityX >= FLING) return 'prev';
  return 'cancel';
}
