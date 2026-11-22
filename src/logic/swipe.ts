/** A vertical drag stays a scroll. A page turn waits for a clearly sideways move. */
export function claimHorizontalSwipe(dx: number, dy: number, editing: boolean): boolean {
  'worklet';
  if (editing) return false;
  return Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5;
}

/** The finger has moved enough, and not sideways, so the page should scroll. */
export function verticalScrollWins(dx: number, dy: number): boolean {
  'worklet';
  return Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx);
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

/** A corner fold has to travel this far inward before it can turn the page. A tap is nowhere near it. */
export const CORNER_COMMIT = 72;

/**
 * A drag that starts in a corner and pulls inward. A tap, or a vertical scroll
 * that only brushes the corner, returns null.
 */
export function cornerFold(
  startX: number,
  startY: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
): { direction: 'next' | 'prev'; inward: number } | null {
  if (width < 40 || height < 40) return null;
  const onEdge = startY < height * 0.34 || startY > height * 0.66;
  if (!onEdge) return null;
  const fromRight = startX > width * 0.78;
  const fromLeft = startX < width * 0.22;
  if (!fromRight && !fromLeft) return null;
  const inward = fromRight ? -dx : dx;
  if (inward < 36) return null;
  if (inward < Math.abs(dy) * 0.45) return null;
  return { direction: fromRight ? 'next' : 'prev', inward };
}

export function releaseCorner(inward: number, velocityX: number, blocked: boolean): 'commit' | 'cancel' {
  if (blocked) return 'cancel';
  if (inward >= CORNER_COMMIT) return 'commit';
  if (Math.abs(velocityX) >= CURL_FLING && inward >= 36) return 'commit';
  return 'cancel';
}

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
