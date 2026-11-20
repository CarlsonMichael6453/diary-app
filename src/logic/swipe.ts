/** Horizontal page turns should win only after the gesture is clearly sideways. */
export function claimHorizontalSwipe(dx: number, dy: number, editing: boolean): boolean {
  'worklet';
  if (editing) return false;
  if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return false;
  return Math.abs(dx) > Math.abs(dy) + 8;
}

/**
 * Once a curl is active, release commits past about 37% revealed or on a fast fling.
 * A blocked edge (no neighbor) never commits. velocityX is pixels per second.
 */
export function releaseCurl(direction: 'next' | 'prev', reveal: number, velocityX: number, blocked: boolean): 'commit' | 'cancel' {
  'worklet';
  if (blocked) return 'cancel';
  if (direction === 'next' && velocityX >= 900) return 'cancel';
  if (direction === 'prev' && velocityX <= -900) return 'cancel';
  if (direction === 'next' && (reveal >= 0.37 || velocityX <= -900)) return 'commit';
  if (direction === 'prev' && (reveal >= 0.37 || velocityX >= 900)) return 'commit';
  return 'cancel';
}

const COMMIT = 0.37;
const FLING = 900;

/**
 * Negative progress is a swipe toward the next page.
 * Past about 37% of the width commits. A fast fling commits too, and a fast
 * fling the other way wins so a reversed drag can fall back or turn around.
 * velocityX is pixels per second.
 */
export function releaseSwipe(progress: number, velocityX = 0): 'next' | 'prev' | 'cancel' {
  if (velocityX <= -FLING) return 'next';
  if (velocityX >= FLING) return 'prev';
  if (progress <= -COMMIT) return 'next';
  if (progress >= COMMIT) return 'prev';
  return 'cancel';
}
