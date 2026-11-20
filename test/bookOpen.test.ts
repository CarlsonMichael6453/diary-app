import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OPEN_FAMILIES, PACK_FAMILY, THEME_FAMILY, bookOpenFamily, familyForHue } from '../src/logic/bookOpen';
import { THEMES } from '../src/theme/themes';

describe('book opening music', () => {
  it('gives every book style and seasonal pack a family, with 10 to 15 jingles', () => {
    assert.ok(OPEN_FAMILIES.length >= 10 && OPEN_FAMILIES.length <= 15);
    for (const theme of THEMES) {
      assert.ok(OPEN_FAMILIES.includes(THEME_FAMILY[theme.id]), theme.id);
    }
    for (const family of Object.values(PACK_FAMILY)) {
      assert.ok(OPEN_FAMILIES.includes(family));
    }
    assert.equal(PACK_FAMILY.christmas, 'christmas');
    assert.equal(PACK_FAMILY.halloween, 'halloween');
    assert.equal(PACK_FAMILY.valentines, 'valentine');
  });

  it('lets a custom color design choose the jingle', () => {
    assert.equal(bookOpenFamily({ themeId: 'forest' }), 'forest');
    assert.equal(bookOpenFamily({ themeId: 'forest', design: { pattern: 'solid', colorA: '#1F8A9E', metal: 'gold' } }), 'elegant');
    assert.equal(bookOpenFamily({ themeId: 'goth', design: { pattern: 'hearts', colorA: '#222222', metal: 'none' } }), 'floral');
    assert.equal(bookOpenFamily({ themeId: 'cutesy', design: { pattern: 'stars', colorA: '#F4A3B8', metal: 'none' } }), 'night');
    assert.equal(familyForHue('#1F8A9E'), 'ocean');
    assert.equal(familyForHue('#7DCE82'), 'forest');
    assert.equal(familyForHue('#F4A3B8'), 'floral');
  });
});
