import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { COVER_MATERIALS, STYLE_OPEN, bookOpenStyle, everyStyleHasItsOwnOpenSound, styleForHue } from '../src/logic/bookOpen';
import { THEMES } from '../src/theme/themes';

describe('book opening music', () => {
  it('gives every book style its own clip and a cover material', () => {
    assert.equal(everyStyleHasItsOwnOpenSound(), true);
    assert.equal(Object.keys(STYLE_OPEN).length, THEMES.length);
    const files = new Set(THEMES.map((theme) => theme.id));
    assert.equal(files.size, THEMES.length);
    for (const material of Object.values(STYLE_OPEN)) assert.ok(COVER_MATERIALS.includes(material));
    assert.equal(STYLE_OPEN.goth, 'leather');
    assert.equal(STYLE_OPEN.cottagecore, 'cloth');
    assert.equal(STYLE_OPEN.cutesy, 'sparkle');
    assert.equal(STYLE_OPEN.minimal, 'paper');
  });

  it('plays that style, and lets a custom color pick a cover', () => {
    assert.equal(bookOpenStyle({ themeId: 'forest' }), 'forest');
    assert.equal(bookOpenStyle({ themeId: 'neon-glow' }), 'neon-glow');
    assert.equal(bookOpenStyle({ themeId: 'forest', design: { pattern: 'solid', colorA: '#1F8A9E', metal: 'gold' } }), 'aurora');
    assert.equal(bookOpenStyle({ themeId: 'goth', design: { pattern: 'hearts', colorA: '#222222', metal: 'none' } }), 'cutesy');
    assert.equal(bookOpenStyle({ themeId: 'cutesy', design: { pattern: 'stars', colorA: '#F4A3B8', metal: 'none' } }), 'galaxy');
    assert.equal(styleForHue('#1F8A9E'), 'ocean');
    assert.equal(styleForHue('#7DCE82'), 'forest');
  });
});
