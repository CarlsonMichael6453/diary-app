import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BUDDY_SOUND_IDS, PAGE_SOUND_IDS, canPlaySound, pageTurnsForCommits, pickPageSound, type SoundPrefs } from '../src/logic/sound';
import { claimHorizontalSwipe, releaseSwipe } from '../src/logic/swipe';

const on: SoundPrefs = { soundEnabled: true, buddySounds: true, pageSounds: true, soundVolume: 0.7 };

describe('sounds', () => {
  it('gives every pal a sound and keeps at least five page turns', () => {
    assert.equal(BUDDY_SOUND_IDS.length, 12);
    assert.equal(new Set(BUDDY_SOUND_IDS).size, 12);
    for (const id of ['mochi', 'batsy', 'sprout', 'glitter', 'prism', 'inky', 'pip', 'nova', 'shelly', 'ghosty', 'ember', 'lumi']) {
      assert.ok(BUDDY_SOUND_IDS.includes(id as (typeof BUDDY_SOUND_IDS)[number]), id);
    }
    assert.equal(PAGE_SOUND_IDS.length, 15);
    assert.equal(new Set(PAGE_SOUND_IDS).size, 15);
    for (const stem of ['real-1-slow-journal', 'real-2-journal-rustle', 'real-4-book-page-turn', 'real-5-book-page-flip', 'real-6-heavy-sketchbook']) {
      for (const suffix of ['', '-faster', '-slower']) {
        assert.ok(PAGE_SOUND_IDS.includes(`${stem}${suffix}` as (typeof PAGE_SOUND_IDS)[number]), `${stem}${suffix}`);
      }
    }
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

  it('plays a page-turn sound for every completed turn, even in a rapid run', () => {
    const played = pageTurnsForCommits(8, on, () => 0.2);
    assert.equal(played.length, 8);
    for (let i = 1; i < played.length; i += 1) assert.notEqual(played[i], played[i - 1]);
    assert.deepEqual(pageTurnsForCommits(5, { ...on, soundEnabled: false }), []);
    assert.deepEqual(pageTurnsForCommits(5, { ...on, pageSounds: false }), []);
    assert.deepEqual(pageTurnsForCommits(5, { ...on, soundVolume: 0 }), []);
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

  it('locks a sideways swipe and leaves typing and vertical drags alone', () => {
    assert.equal(claimHorizontalSwipe(40, 4, false), true);
    assert.equal(claimHorizontalSwipe(-30, 6, false), true);
    assert.equal(claimHorizontalSwipe(8, 2, false), false);
    assert.equal(claimHorizontalSwipe(10, 40, false), false);
    assert.equal(claimHorizontalSwipe(40, 4, true), false);
    assert.equal(releaseSwipe(-0.2), 'next');
    assert.equal(releaseSwipe(0.2), 'prev');
    assert.equal(releaseSwipe(0.1), 'cancel');
    assert.equal(releaseSwipe(-0.05, -1200), 'next');
    assert.equal(releaseSwipe(0.05, 1200), 'prev');
    assert.equal(releaseSwipe(-0.5, 1200), 'next');
  });
});
