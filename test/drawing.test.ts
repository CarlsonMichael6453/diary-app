import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DRAW_COLORS, padStrokes, pageStrokes, pencilCursorCss, pencilSvg, strokesFrom } from '../src/logic/drawing';

describe('drawing pencil', () => {
  it('offers a full palette and tints the pencil with the chosen color', () => {
    assert.ok(DRAW_COLORS.length >= 28);
    assert.equal(new Set(DRAW_COLORS).size, DRAW_COLORS.length);
    const cursor = pencilCursorCss('#2E86FF');
    assert.ok(cursor.includes('%232E86FF') || cursor.includes('#2E86FF'));
    assert.ok(cursor.startsWith('url("data:image/svg+xml,'));
    assert.ok(cursor.includes(' 3 29, crosshair'));
    assert.ok(pencilSvg('#FF4D6D').includes('#FF4D6D'));
    assert.ok(!pencilSvg('nope').includes('nope'));
  });

  it('keeps an old draw-box stroke in its box and a new stroke on the page', () => {
    const raw = JSON.stringify([
      { points: '4,8 12,20', color: '#111111' },
      { points: '40,80 90,120', color: '#2E86FF', size: 5, space: 'page' },
    ]);
    const strokes = strokesFrom(raw);
    assert.equal(padStrokes(strokes).length, 1);
    assert.equal(pageStrokes(strokes).length, 1);
    assert.equal(strokesFrom('not-json').length, 0);
  });
});
