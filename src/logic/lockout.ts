/**
 * Passcode attempt lockout. Pure functions so the rules can be tested without a device.
 * Five free tries, then waits that grow: 30s, 1m, 5m, 15m, 1h (and 1h from then on).
 */
export type LockoutState = { failures: number; lockedUntil: number };

export const FREE_ATTEMPTS = 5;
const WAIT_STEPS_MS = [30_000, 60_000, 300_000, 900_000, 3_600_000];

export const EMPTY_LOCKOUT: LockoutState = { failures: 0, lockedUntil: 0 };

export function lockRemainingMs(state: LockoutState, now: number): number {
  return Math.max(0, state.lockedUntil - now);
}

export function recordFailure(state: LockoutState, now: number): LockoutState {
  const failures = state.failures + 1;
  if (failures < FREE_ATTEMPTS) return { failures, lockedUntil: state.lockedUntil };
  const step = Math.min(failures - FREE_ATTEMPTS, WAIT_STEPS_MS.length - 1);
  return { failures, lockedUntil: now + WAIT_STEPS_MS[step] };
}

export function parseLockout(raw: string | null): LockoutState {
  if (!raw) return EMPTY_LOCKOUT;
  try {
    const value = JSON.parse(raw) as Partial<LockoutState>;
    const failures = Number(value.failures);
    const lockedUntil = Number(value.lockedUntil);
    if (!Number.isFinite(failures) || !Number.isFinite(lockedUntil) || failures < 0 || lockedUntil < 0) return EMPTY_LOCKOUT;
    return { failures: Math.floor(failures), lockedUntil };
  } catch {
    return EMPTY_LOCKOUT;
  }
}

export function describeWait(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
