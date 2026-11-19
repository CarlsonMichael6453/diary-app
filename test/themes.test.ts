import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { THEMES, getTheme } from '../src/theme/themes';

const FREE = ['cutesy', 'goth', 'girlypop', 'rainbow', 'cottagecore', 'y2k', 'minimal', 'kawaii', 'academia', 'ocean', 'neon', 'retro', 'psychedelic', 'vaporwave', 'galaxy', 'grunge', 'steampunk', 'witchy', 'candy', 'forest', 'sunset', 'cyberpunk'];
const PREMIUM = ['neon-glow', 'galaxy-drift', 'lava-lamp', 'sparkle-rain', 'aurora'];

describe('book styles', () => {
  it('keeps most styles free and locks the animated ones', () => {
    assert.equal(new Set(THEMES.map((theme) => theme.id)).size, THEMES.length);
    const free = THEMES.filter((theme) => !theme.premium);
    const premium = THEMES.filter((theme) => theme.premium);
    assert.ok(free.length > premium.length);
    assert.ok(free.length >= 20);
    for (const id of FREE) {
      const theme = THEMES.find((item) => item.id === id);
      assert.ok(theme, id);
      assert.equal(Boolean(theme.premium), false);
    }
    for (const id of PREMIUM) {
      const theme = THEMES.find((item) => item.id === id);
      assert.ok(theme, id);
      assert.equal(theme.premium, true);
      assert.ok(theme.motion && theme.motion !== 'none');
    }
    assert.equal(getTheme('missing').id, 'cutesy');
    assert.equal(getTheme('aurora').name, 'Aurora');
  });
});