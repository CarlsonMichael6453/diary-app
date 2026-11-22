import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { palMayRemember, palRecall } from '../src/logic/palMemory';
import { buyGoods, buyTheme, clampSpot, defaultRoom, moveItem, placeItem, resizeItem } from '../src/room/edit';
import { fitDrawing } from '../src/room/fitDrawing';
import { FURNITURE, goodsById } from '../src/room/catalog';

describe('pal memories', () => {
  const today = '2026-11-22';
  const secret = 'the private sentence that must stay off the bubble';

  it('mentions a title from a year ago and never the page body', () => {
    const recall = palRecall([
      { id: 'old', date: '2025-11-22', title: 'The long way home', body: secret, mood: 'grateful' },
    ], today);
    assert.ok(recall);
    assert.equal(recall?.entryId, 'old');
    assert.match(recall?.line ?? '', /long way home/);
    assert.equal((recall?.line ?? '').includes(secret), false);
    assert.equal(palRecall([{ id: 'old', date: '2025-11-21', title: 'Nope', body: secret, mood: 'calm' }], '2026-11-21'), null);
  });

  it('stays quiet when the pal is off or deep writing is on', () => {
    assert.equal(palMayRemember({ palOn: true, deepWriting: false }), true);
    assert.equal(palMayRemember({ palOn: false, deepWriting: false }), false);
    assert.equal(palMayRemember({ palOn: true, deepWriting: true }), false);
  });
});

describe('pal room', () => {
  it('moves, buys, and refuses a purchase the wallet cannot cover', () => {
    const room = defaultRoom();
    const moved = moveItem(room, 'placed-bed', 2, -1);
    const bed = moved.items.find((item) => item.id === 'placed-bed');
    assert.equal(bed?.x, clampSpot(2));
    assert.equal(bed?.y, clampSpot(-1));
    const clock = goodsById('clock');
    assert.ok(clock);
    const bought = buyGoods(room, 60, false, clock!);
    assert.equal(bought.ok, true);
    assert.equal(bought.coins, 60 - clock!.price);
    const pricey = FURNITURE.find((item) => item.price > 60);
    if (pricey) {
      const refused = buyGoods(room, 10, false, pricey);
      assert.equal(refused.ok, false);
    }
    const plus = buyTheme(room, 100, false, 'candy');
    assert.equal(plus.ok, false);
  });

  it('lets plushies overlap in a corner and keeps the dragged one in front', () => {
    const room = placeItem(defaultRoom(), 'plush-mochi', 'pile');
    const parked = moveItem(room, 'pile', 0, 1);
    const plush = parked.items.find((item) => item.id === 'pile');
    assert.equal(plush?.x, 0.02);
    assert.equal(plush?.y, 0.98);
    const again = moveItem(parked, 'placed-plush', 0.04, 0.9);
    const sprout = again.items.find((item) => item.id === 'placed-plush');
    assert.ok((sprout?.z ?? 0) > (plush?.z ?? 0));
    const bed = moveItem(room, 'placed-bed', 0, 0).items.find((item) => item.id === 'placed-bed');
    assert.equal(bed?.x, 0.1);
  });

  it('places another frame, resizes it, and fits a drawing into the easel canvas', () => {
    const room = placeItem(defaultRoom(), 'frame-gold', 'second-frame');
    assert.equal(room.items.filter((item) => item.kind === 'frame-gold').length, 2);
    const grown = resizeItem(room, 'second-frame', 9);
    const shrunk = resizeItem(room, 'second-frame', 0.1);
    assert.equal(grown.items.find((item) => item.id === 'second-frame')?.scale, 2.2);
    assert.equal(shrunk.items.find((item) => item.id === 'second-frame')?.scale, 0.65);
    const high = moveItem(room, 'placed-frame', 0.4, 0);
    assert.equal(high.items.find((item) => item.id === 'placed-frame')?.y, 0.02);
    const fitted = fitDrawing([{ points: '0,0 100,40', color: '#E85D4C', size: 4 }], { x: 10, y: 10, w: 100, h: 80 });
    assert.equal(fitted.length, 1);
    assert.match(fitted[0].d, /^M/);
    assert.ok(fitted[0].width > 1);
  });
});
