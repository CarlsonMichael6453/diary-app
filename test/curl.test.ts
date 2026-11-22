import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CURL_FOLD, curlLayout, foldAngle } from '../src/logic/curl';
import { cornerFold, releaseCorner, releaseCurl } from '../src/logic/swipe';

describe('soft curl', () => {
  it('pins the fold to the finger with no dead zone', () => {
    const layout = curlLayout(120, 200, 400, 640, 'next');
    assert.equal(layout.foldX, 120);
    assert.equal(layout.side, 'next');
    assert.equal(layout.coverLeft, 120);
    assert.ok(Math.abs(layout.curlLeft + layout.curlWidth * 0.35 - 120) < 1);
    assert.equal(layout.curlWidth, CURL_FOLD);
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
    assert.equal(releaseCurl('next', 0.18, 0, false), 'commit');
    assert.equal(releaseCurl('next', 0.1, -300, false), 'commit');
    assert.equal(releaseCurl('prev', 0.1, 300, false), 'commit');
    assert.equal(releaseCurl('next', 0.5, 300, false), 'commit');
    assert.equal(releaseCurl('next', 0.1, 0, false), 'cancel');
  });

  it('ignores a corner tap and commits a real inward fold', () => {
    assert.equal(cornerFold(360, 20, 4, 2, 400, 640), null);
    assert.equal(cornerFold(20, 600, -6, 4, 400, 640), null);
    assert.equal(cornerFold(200, 40, -80, 4, 400, 640), null);
    const fold = cornerFold(370, 30, -90, -20, 400, 640);
    assert.equal(fold?.direction, 'next');
    assert.equal(releaseCorner(fold?.inward ?? 0, 0, false), 'commit');
    assert.equal(releaseCorner(40, 0, false), 'cancel');
    assert.equal(releaseCorner(90, 0, true), 'cancel');
  });
});
