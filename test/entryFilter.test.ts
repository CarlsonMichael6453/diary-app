import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clearBrowseFilter, getBrowseFilter, toggleFilterMood, toggleFilterTag } from '../src/logic/browseFilter';
import { entryMatches, filterIsActive } from '../src/logic/entryFilter';

describe('page filters', () => {
  const pages = [
    { mood: 'grateful', tags: ['walk', 'home'], voiceNote: 'clip' },
    { mood: 'fired', tags: ['walk'] },
    { mood: 'calm', tags: ['tea'], activities: ['rest'] },
  ];

  it('matches a mood and a tag together, and any one of several moods', () => {
    assert.equal(entryMatches(pages[0], { moods: [], tags: [] }), true);
    assert.equal(entryMatches(pages[0], { moods: ['grateful'], tags: ['walk'] }), true);
    assert.equal(entryMatches(pages[0], { moods: ['fired'], tags: ['walk'] }), false);
    assert.equal(entryMatches(pages[1], { moods: ['grateful', 'fired'], tags: [] }), true);
    assert.equal(entryMatches(pages[2], { moods: ['calm'], tags: ['rest'] }), true);
    assert.equal(entryMatches(pages[2], { moods: ['calm'], tags: ['home'] }), false);
    assert.equal(pages[0].voiceNote, 'clip');
  });

  it('clears every selected mood and tag', () => {
    clearBrowseFilter();
    toggleFilterMood('grateful');
    toggleFilterTag('walk');
    assert.deepEqual(getBrowseFilter(), { moods: ['grateful'], tags: ['walk'] });
    toggleFilterTag('Walk');
    assert.deepEqual(getBrowseFilter().tags, []);
    assert.equal(filterIsActive(getBrowseFilter()), true);
    clearBrowseFilter();
    assert.equal(filterIsActive(getBrowseFilter()), false);
  });
});
