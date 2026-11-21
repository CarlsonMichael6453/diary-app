import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { tagSummary } from '../src/logic/tags';

describe('page chrome', () => {
  it('summarizes tags without changing how they are stored', () => {
    assert.equal(tagSummary([], []), 'Tags');
    assert.equal(tagSummary(undefined, ['walk']), 'walk');
    assert.equal(tagSummary(['home'], ['walk', 'rest']), 'walk +2');
  });

  it('keeps the Pal companion and puts style controls in one sheet', () => {
    const entry = readFileSync(new URL('../app/entry/[id].tsx', import.meta.url), 'utf8');
    const lock = readFileSync(new URL('../src/components/IconButton.tsx', import.meta.url), 'utf8');
    const settings = readFileSync(new URL('../app/(tabs)/settings.tsx', import.meta.url), 'utf8');
    assert.match(entry, /label="Style"/);
    assert.match(entry, /label="Pal"/);
    assert.match(entry, /router\.push\('\/buddies'/);
    assert.match(entry, /'Decorate'/);
    assert.match(entry, /'Theme'/);
    assert.match(entry, /'Palette'/);
    assert.match(lock, /Your diary is stored privately on this device\./);
    assert.match(entry, /FadeChrome hidden=\{deep\}/);
    assert.match(settings, /Your diary is stored privately on this device\./);
  });
});
