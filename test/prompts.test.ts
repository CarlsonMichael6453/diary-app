import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { PROMPTS, nextPrompt, promptForDate, visiblePrompt } from '../src/data/prompts';

describe('writing prompts', () => {
  it('shuffles to a different prompt and never repeats the current one', () => {
    for (const prompt of PROMPTS) {
      assert.notEqual(nextPrompt(prompt, () => 0), prompt);
      assert.notEqual(nextPrompt(prompt, () => 0.999), prompt);
    }
    const first = nextPrompt(PROMPTS[0], () => 0);
    assert.equal(nextPrompt(PROMPTS[0], () => 0), first);
  });

  it('hides a prompt on one page and keeps the date prompt on another', () => {
    const date = '2026-11-20';
    const daily = promptForDate(date);
    assert.equal(visiblePrompt({ date }, true), daily);
    assert.equal(visiblePrompt({ date, prompt: 'A chosen question' }, true), 'A chosen question');
    assert.equal(visiblePrompt({ date, promptHidden: true }, true), null);
    assert.equal(visiblePrompt({ date: '2026-11-18' }, true), promptForDate('2026-11-18'));
    assert.equal(visiblePrompt({ date, prompt: 'A chosen question' }, false), null);
  });

  it('saves the writing prompts switch on by default', () => {
    const settings = readFileSync(new URL('../src/models/types.ts', import.meta.url), 'utf8');
    const defaults = readFileSync(new URL('../src/store/useDiary.ts', import.meta.url), 'utf8');
    const screen = readFileSync(new URL('../app/(tabs)/settings.tsx', import.meta.url), 'utf8');
    assert.match(settings, /writingPrompts: boolean/);
    assert.match(defaults, /writingPrompts: true/);
    assert.match(screen, /Show a question at the top of each page to help you start writing\./);
  });
});
