import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { describeWait, EMPTY_LOCKOUT, FREE_ATTEMPTS, lockRemainingMs, parseLockout, recordFailure } from '../src/logic/lockout';

describe('passcode lockout', () => {
  it('allows the free attempts without a wait', () => {
    let state = EMPTY_LOCKOUT;
    for (let i = 1; i < FREE_ATTEMPTS; i += 1) {
      state = recordFailure(state, 1000);
      assert.equal(lockRemainingMs(state, 1000), 0);
    }
  });

  it('locks for 30 seconds on the fifth miss, then grows', () => {
    let state = EMPTY_LOCKOUT;
    for (let i = 0; i < FREE_ATTEMPTS; i += 1) state = recordFailure(state, 0);
    assert.equal(lockRemainingMs(state, 0), 30_000);
    state = recordFailure(state, 30_000);
    assert.equal(lockRemainingMs(state, 30_000), 60_000);
    state = recordFailure(state, 90_000);
    assert.equal(lockRemainingMs(state, 90_000), 300_000);
  });

  it('caps the wait at one hour', () => {
    let state = EMPTY_LOCKOUT;
    for (let i = 0; i < 30; i += 1) state = recordFailure(state, 0);
    assert.equal(lockRemainingMs(state, 0), 3_600_000);
  });

  it('expires on its own', () => {
    let state = EMPTY_LOCKOUT;
    for (let i = 0; i < FREE_ATTEMPTS; i += 1) state = recordFailure(state, 0);
    assert.equal(lockRemainingMs(state, 31_000), 0);
  });

  it('survives junk in storage', () => {
    assert.deepEqual(parseLockout(null), EMPTY_LOCKOUT);
    assert.deepEqual(parseLockout('nope'), EMPTY_LOCKOUT);
    assert.deepEqual(parseLockout('{"failures":-3,"lockedUntil":1}'), EMPTY_LOCKOUT);
    assert.deepEqual(parseLockout('{"failures":6,"lockedUntil":99}'), { failures: 6, lockedUntil: 99 });
  });

  it('words the wait', () => {
    assert.equal(describeWait(1), '1 second');
    assert.equal(describeWait(30_000), '30 seconds');
    assert.equal(describeWait(60_000), '1 minute');
    assert.equal(describeWait(300_000), '5 minutes');
    assert.equal(describeWait(3_600_000), '1 hour');
  });
});
