import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { collageSlots } from '../src/logic/collage';
import { PAGE_TEXT_ID, isBehindText, reorderStack } from '../src/logic/layers';
import { restoreSavedDesigns } from '../src/logic/savedDesigns';
import type { DiaryEntry, Settings } from '../src/models/types';

describe('page layers and photos', () => {
  it('moves a photo behind the page text and keeps the order', () => {
    const start = [
      { id: PAGE_TEXT_ID, z: 1 },
      { id: 'photo', z: 2 },
      { id: 'note', z: 3 },
    ];
    const behind = reorderStack(start, 'photo', 'backward');
    const photo = behind.find((item) => item.id === 'photo');
    const text = behind.find((item) => item.id === PAGE_TEXT_ID);
    assert.ok(photo && text);
    assert.equal(isBehindText(photo.z, text.z), true);
    const front = reorderStack(behind, 'photo', 'front');
    assert.equal(front[front.length - 1]?.id, 'photo');
    const back = reorderStack(front, 'note', 'back');
    assert.equal(back[0]?.id, 'note');
    const forward = reorderStack(back, 'note', 'forward');
    assert.equal(forward[1]?.id, 'note');
  });

  it('lays out collage presets', () => {
    assert.equal(collageSlots('two', 2).length, 2);
    assert.equal(collageSlots('three', 3).length, 3);
    assert.equal(collageSlots('grid', 4).length, 4);
    const scatter = collageSlots('scatter', 3);
    assert.ok(scatter.every((slot) => slot.frame === 'polaroid'));
    const full = collageSlots('full', 2);
    assert.equal(full[0]?.scale, 2.4);
    assert.ok((full[1]?.scale ?? 1) < 1);
  });

  it('keeps photos, notes, and z-order in a backup import', () => {
    const entry = {
      id: 'p',
      date: '2026-11-20',
      title: 'Picnic',
      body: '',
      mood: 'happy',
      photos: ['data:image/jpeg;base64,abc'],
      stickers: [{ id: 's', stickerId: 'star', x: 0.2, y: 0.3, scale: 1, rotation: 0, z: 4 }],
      photoPlacements: [{ id: 'ph', uri: 'data:image/jpeg;base64,abc', x: 0.4, y: 0.4, scale: 1.2, rotation: -3, frame: 'tape', z: 2 }],
      notes: [{ id: 'n', text: 'Hi', x: 0.6, y: 0.5, scale: 1, rotation: 2, style: 'bubble', fontId: 'caveat', inkColor: '#3A2A32', z: 5 }],
      textZ: 3,
      photoOnly: true,
      themeOverride: null,
      createdAt: 1,
      updatedAt: 1,
    } as DiaryEntry;
    const restored = restoreSavedDesigns({ themeId: 'cutesy', activeBookId: 'daily', books: [] } as unknown as Settings, [entry]);
    const page = restored.entries[0];
    assert.equal(page?.photos[0], 'data:image/jpeg;base64,abc');
    assert.equal(page?.photoPlacements?.[0]?.frame, 'tape');
    assert.equal(page?.photoPlacements?.[0]?.z, 2);
    assert.equal(page?.notes?.[0]?.text, 'Hi');
    assert.equal(page?.notes?.[0]?.style, 'bubble');
    assert.equal(page?.textZ, 3);
    assert.equal(page?.photoOnly, true);
    assert.equal(page?.stickers[0]?.z, 4);
    const dirty = restoreSavedDesigns({ themeId: 'cutesy', activeBookId: 'daily', books: [] } as unknown as Settings, [{
      ...entry,
      photoPlacements: [{ id: 'bad', uri: 'data:image/jpeg;base64,abc', x: 0.1, y: 0.1, scale: 1, rotation: 0, frame: 'nope' as 'tape', z: 1 }],
      notes: [{ id: 'bad', text: 'x', x: 1, y: 1, scale: 1, rotation: 0, style: 'nope' as 'tag' }],
    }]);
    assert.equal(dirty.entries[0]?.photoPlacements?.[0]?.frame, 'none');
    assert.equal(dirty.entries[0]?.notes?.[0]?.style, 'none');
  });
});
