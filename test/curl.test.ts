import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CURL_DIAMETER, curlLayout, foldAngle } from '../src/logic/curl';
import { releaseCurl } from '../src/logic/swipe';

describe('soft curl', () => {
  it('pins the fold to the finger with no dead zone', () => {
    const layout = curlLayout(120, 200, 400, 640, 'next');
    assert.equal(layout.foldX, 120);
    assert.equal(layout.side, 'next');
    assert.equal(layout.coverLeft, 120);
    assert.ok(Math.abs(layout.curlLeft + layout.curlWidth * 0.35 - 120) < 1);
    assert.equal(layout.curlWidth, 400 * CURL_DIAMETER);
    const back = curlLayout(250, 200, 400, 640, 'prev');
    assert.equal(back.foldX, 250);
    assert.equal(back.coverWidth, 250);
  });

  it('tilts the fold toward the finger height and stays straight in the middle', () => {
    assert.ok(Math.abs(foldAngle(320, 640)) < 1);
    assert.ok(foldAngle(40, 640) < -10);
    assert.ok(foldAngle(600, 640) > 10);
    assert.ok(curlLayout(100, 40, 400, 640, 'next').angle < 0);
  });

  it('rubber-bands a missing page and still commits a real fling', () => {
    assert.equal(releaseCurl('next', 0.5, 0, true), 'cancel');
    assert.equal(releaseCurl('prev', 0.8, 0, true), 'cancel');
    assert.equal(releaseCurl('next', 0.4, 0, false), 'commit');
    assert.equal(releaseCurl('next', 0.1, -1200, false), 'commit');
    assert.equal(releaseCurl('prev', 0.1, 1200, false), 'commit');
    assert.equal(releaseCurl('next', 0.5, 1200, false), 'cancel');
    assert.equal(releaseCurl('next', 0.1, 0, false), 'cancel');
  });
});
