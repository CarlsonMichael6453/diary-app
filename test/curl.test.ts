import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CURL_DIAMETER, curlLayout } from '../src/logic/curl';

describe('soft curl', () => {
  it('stays flat until the drag actually moves', () => {
    const flat = curlLayout(0, 400);
    assert.equal(flat.side, 'flat');
    assert.equal(flat.coverWidth, 0);
    assert.equal(curlLayout(0.002, 400).side, 'flat');
  });

  it('curls the right edge toward the next page and the left edge back', () => {
    const next = curlLayout(-0.5, 400);
    assert.equal(next.side, 'next');
    assert.ok(next.curlLeft < 400);
    assert.ok(next.curlLeft > 0);
    assert.equal(next.curlWidth, 400 * CURL_DIAMETER);
    assert.ok(next.coverLeft >= next.curlLeft - 1);
    const prev = curlLayout(0.5, 400);
    assert.equal(prev.side, 'prev');
    assert.ok(prev.coverWidth > 0);
    assert.ok(prev.coverWidth < 400);
    assert.ok(prev.curlLeft < prev.coverWidth);
  });

  it('follows a reversal from next back through flat', () => {
    const forward = curlLayout(-0.4, 300);
    const back = curlLayout(0.15, 300);
    assert.equal(forward.side, 'next');
    assert.equal(back.side, 'prev');
    assert.ok(curlLayout(-1, 300).coverWidth > curlLayout(-0.2, 300).coverWidth);
  });
});
