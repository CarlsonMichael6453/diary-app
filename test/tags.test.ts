import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mergeTagCatalog, selectCreatedTag, tagSummary, toggleTag } from '../src/logic/tags';
import { formatVoiceTime, voiceProgress } from '../src/logic/voice';

describe('created tags', () => {
  it('selects a new tag and keeps it in the shared list', () => {
    const first = selectCreatedTag([], ['walk'], '  seaside  ');
    assert.deepEqual(first.tags, ['seaside']);
    assert.deepEqual(first.catalog, ['walk', 'seaside']);
    const again = selectCreatedTag([], first.catalog, 'Seaside');
    assert.deepEqual(again.tags, ['seaside']);
    assert.deepEqual(again.catalog, ['walk', 'seaside']);
    assert.deepEqual(selectCreatedTag(['seaside'], first.catalog, 'SEASIDE').tags, ['seaside']);
  });

  it('toggles a tag without dropping the others', () => {
    assert.deepEqual(toggleTag(['seaside'], 'seaside'), []);
    assert.deepEqual(toggleTag(['seaside'], 'home'), ['seaside', 'home']);
  });

  it('shows tags from other pages in the menu', () => {
    const catalog = mergeTagCatalog(['home'], [{ tags: ['seaside'] }, { tags: ['home'] }]);
    assert.deepEqual(catalog, ['home', 'seaside']);
    assert.equal(tagSummary(['seaside'], ['walk']), 'walk +1');
  });
});

describe('voice note clock', () => {
  it('formats a duration and a progress fraction', () => {
    assert.equal(formatVoiceTime(0), '0:00');
    assert.equal(formatVoiceTime(65), '1:05');
    assert.equal(formatVoiceTime(Number.NaN), '0:00');
    assert.equal(voiceProgress(15, 60), 0.25);
    assert.equal(voiceProgress(80, 60), 1);
    assert.equal(voiceProgress(1, 0), 0);
  });
});
