/** Horizontal page turns should win only after the gesture is clearly sideways. */
export function claimHorizontalSwipe(dx: number, dy: number, editing: boolean): boolean {
  if (editing) return false;
  if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return false;
  return Math.abs(dx) > Math.abs(dy) + 8;
}

/** Negative progress is a swipe toward the next page. */
export function releaseSwipe(progress: number): 'next' | 'prev' | 'cancel' {
  if (progress <= -0.22) return 'next';
  if (progress >= 0.22) return 'prev';
  return 'cancel';
}
