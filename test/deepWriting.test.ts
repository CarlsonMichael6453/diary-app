import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('deep writing mode', () => {
  it('saves the choice and hides the page chrome while writing stays', () => {
    const settings = readFileSync(new URL('../src/models/types.ts', import.meta.url), 'utf8');
    const defaults = readFileSync(new URL('../src/store/useDiary.ts', import.meta.url), 'utf8');
    const entry = readFileSync(new URL('../app/entry/[id].tsx', import.meta.url), 'utf8');
    const toggle = readFileSync(new URL('../src/components/FadeChrome.tsx', import.meta.url), 'utf8');
    const screen = readFileSync(new URL('../app/(tabs)/settings.tsx', import.meta.url), 'utf8');
    assert.match(settings, /deepWriting: boolean/);
    assert.match(defaults, /deepWriting: false/);
    assert.match(entry, /FadeChrome hidden=\{deep\}/);
    assert.match(entry, /DeepWritingButton/);
    assert.match(toggle, /accessibilityLabel="Deep writing mode"/);
    assert.match(entry, /setDrawingMode\(false\)/);
    assert.match(screen, /Deep writing mode/);
    assert.match(screen, /Typing and page turns stay available/);
  });
});
