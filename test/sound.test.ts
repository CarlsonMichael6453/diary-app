import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BUDDY_SOUND_IDS, PAGE_SOUND_IDS, canPlaySound, pickPageSound, type SoundPrefs } from '../src/logic/sound';

const on: SoundPrefs = { soundEnabled: true, buddySounds: true, pageSounds: true, soundVolume: 0.7 };

describe('sounds', () => {
  it('gives every pal a sound and keeps at least five page turns', () => {
    assert.equal(BUDDY_SOUND_IDS.length, 12);
    assert.equal(new Set(BUDDY_SOUND_IDS).size, 12);
    for (const id of ['mochi', 'batsy', 'sprout', 'glitter', 'prism', 'inky', 'pip', 'nova', 'shelly', 'ghosty', 'ember', 'lumi']) {
      assert.ok(BUDDY_SOUND_IDS.includes(id as (typeof BUDDY_SOUND_IDS)[number]), id);
    }
    assert.ok(PAGE_SOUND_IDS.length >= 5);
  });

  it('respects the master switch, each channel, and a zero volume', () => {
    assert.equal(canPlaySound('buddy', on), true);
    assert.equal(canPlaySound('page', on), true);
    assert.equal(canPlaySound('buddy', { ...on, soundEnabled: false }), false);
    assert.equal(canPlaySound('page', { ...on, soundEnabled: false }), false);
    assert.equal(canPlaySound('buddy', { ...on, buddySounds: false }), false);
    assert.equal(canPlaySound('page', { ...on, buddySounds: false }), true);
    assert.equal(canPlaySound('page', { ...on, pageSounds: false }), false);
    assert.equal(canPlaySound('buddy', { ...on, soundVolume: 0 }), false);
  });

  it('does not play the same page-turn sound twice in a row', () => {
    let previous: string | null = null;
    for (let i = 0; i < 24; i += 1) {
      const next = pickPageSound(PAGE_SOUND_IDS, previous, () => 0);
      assert.notEqual(next, previous);
      assert.ok(PAGE_SOUND_IDS.includes(next as (typeof PAGE_SOUND_IDS)[number]));
      previous = next;
    }
    assert.equal(pickPageSound(['only'], 'only', () => 0), 'only');
  });
});
