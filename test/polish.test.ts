import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const screensWithoutLocalBack = [
  '../app/album.tsx',
  '../app/buddies.tsx',
  '../app/color-designer.tsx',
  '../app/feedback.tsx',
  '../app/games/catch.tsx',
  '../app/games/memory.tsx',
  '../app/games/spin.tsx',
  '../app/privacy.tsx',
  '../app/stats.tsx',
  '../app/sticker-store.tsx',
  '../app/widget-preview.tsx',
] as const;

function read(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), 'utf8');
}

describe('navigation polish', () => {
  it('keeps the shared Screen top bar with Back on screens that dropped a local Back button', () => {
    const screen = read('../src/components/Screen.tsx');
    assert.match(screen, /nav = true/);
    assert.match(screen, /\{nav \? <NavRow \/> : null\}/);
    assert.match(screen, /accessibilityLabel="Back"/);
    assert.match(screen, /‹ Back/);

    for (const path of screensWithoutLocalBack) {
      const source = read(path);
      assert.match(source, /<Screen[\s>]/, path);
      assert.doesNotMatch(source, /nav=\{false\}/, path);
      assert.doesNotMatch(source, /label="Back"/, path);
      assert.doesNotMatch(source, />Back<\/Text>/, path);
    }
  });

  it('keeps the entry page Back because that screen hides the shared top bar', () => {
    const entry = read('../app/entry/[id].tsx');
    assert.match(entry, /<Screen nav=\{false\}/);
    assert.match(entry, /accessibilityLabel="Back"/);
    assert.match(entry, /‹ Back/);
  });

  it('styles Home, Send feedback, and Tap to open with chipInk and underlines the links', () => {
    const screen = read('../src/components/Screen.tsx');
    const home = read('../app/(tabs)/index.tsx');
    const lock = read('../src/components/LockScreen.tsx');
    assert.match(screen, /color: home \? theme\.colors\.chipInk : theme\.colors\.ink/);
    assert.match(home, /color: theme\.colors\.chipInk, fontFamily: theme\.body, fontSize: 15, textDecorationLine: 'underline'/);
    assert.match(lock, /color: theme\.colors\.chipInk, fontFamily: theme\.body, fontSize: 18, textDecorationLine: 'underline'/);
  });

  it('drops the web focus outline on page title and body, and leaves room for a bottom-right pal', () => {
    const entry = read('../app/entry/[id].tsx');
    assert.match(entry, /const pageInputWeb = \(Platform\.OS === 'web' \? \{ outlineStyle: 'none', outlineWidth: 0 \} : \{\}\) as object;/);
    assert.equal((entry.match(/pageInputWeb/g) ?? []).length, 3);
    assert.match(entry, /const palBesideButtons = Boolean\(buddy\) && !deep && perch === 'br';/);
    assert.match(entry, /paddingRight: palBesideButtons \? 200 : padding\.paddingRight/);
  });
});
