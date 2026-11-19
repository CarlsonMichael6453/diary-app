export type MotionSample = { t: number; x: number };

/** Several quick direction changes count as a wiggle or a shake. */
export function reversalCount(samples: MotionSample[], now: number, windowMs = 700, minDelta = 8): number {
  const recent = samples.filter((sample) => now - sample.t <= windowMs);
  let reversals = 0;
  let direction = 0;
  for (let index = 1; index < recent.length; index += 1) {
    const delta = recent[index].x - recent[index - 1].x;
    if (Math.abs(delta) < minDelta) continue;
    const next = delta > 0 ? 1 : -1;
    if (direction !== 0 && next !== direction) reversals += 1;
    direction = next;
  }
  return reversals;
}

export function isWiggle(samples: MotionSample[], now: number): boolean {
  return reversalCount(samples, now, 800, 12) >= 4;
}

export function isShake(samples: MotionSample[], now: number): boolean {
  return reversalCount(samples, now, 800, 0.35) >= 3;
}
