import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSavedDesigns } from '../src/logic/savedDesigns';
import { angleDelta, clampStickerPosition, normalizeDegrees, pointerAngle, rotationFromDrag, snapCardinal } from '../src/logic/stickerPlacement';
import type { DiaryEntry, Settings, StickerPlacement } from '../src/models/types';

describe('sticker placement', () => {
  it('keeps a sticker inside the page', () => {
    assert.deepEqual(clampStickerPosition(0.4, 0.6), { x: 0.4, y: 0.6 });
    assert.deepEqual(clampStickerPosition(-1, 3), { x: 0.08, y: 0.92 });
  });

  it('turns with the finger and snaps near a straight angle', () => {
    assert.equal(normalizeDegrees(-15), 345);
    assert.equal(pointerAngle(0, 0, 0, -10), 270);
    assert.equal(angleDelta(10, 350), -20);
    assert.equal(rotationFromDrag(10, 0, 25), 35);
    assert.equal(snapCardinal(4), 0);
    assert.equal(snapCardinal(88), 90);
    assert.equal(snapCardinal(182), 180);
    assert.equal(snapCardinal(273), 270);
    assert.equal(rotationFromDrag(80, 0, 8), 90);
    assert.equal(rotationFromDrag(350, 10, 18), 0);
  });

  it('saves position and rotation, and treats a missing rotation as zero', () => {
    const settings = { themeId: 'cutesy', activeBookId: 'daily', books: [{ id: 'daily', title: 'Daily', themeId: 'cutesy' }] } as Settings;
    const entry = {
      id: 'page',
      date: '2026-11-20',
      title: 'Stars',
      body: '',
      mood: 'calm',
      photos: [],
      themeOverride: null,
      createdAt: 1,
      updatedAt: 1,
      stickers: [
        { id: 'a', stickerId: 'star', x: 0.25, y: 0.4, scale: 1.2, rotation: 33, z: 3 },
        { id: 'b', stickerId: 'heart', x: 0.7, y: 0.3, scale: 1 } as StickerPlacement,
      ],
    } as DiaryEntry;
    const restored = restoreSavedDesigns(settings, [entry]);
    const [kept, older] = restored.entries[0]?.stickers ?? [];
    assert.equal(kept?.x, 0.25);
    assert.equal(kept?.y, 0.4);
    assert.equal(kept?.rotation, 33);
    assert.equal(older?.rotation, 0);
    assert.equal(older?.x, 0.7);
    const again = restoreSavedDesigns(settings, JSON.parse(JSON.stringify(restored.entries)) as DiaryEntry[]);
    assert.equal(again.entries[0]?.stickers[0]?.rotation, 33);
    assert.equal(again.entries[0]?.stickers[0]?.x, 0.25);
  });
});
