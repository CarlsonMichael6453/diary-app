import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getTheme } from '../src/theme/themes';
import {
  FREE_SWATCHES,
  METAL_CHOICES,
  MOTION_CHOICES,
  PATTERN_IDS,
  activeMetal,
  applyDesign,
  defaultDesign,
  designNeedsPlus,
  hslToHex,
  isHexColor,
  shouldAnimate,
  swatchHex,
  visibleDesign,
} from '../src/theme/designs';

describe('color designer', () => {
  it('offers the free patterns and keeps motion and metal behind Plus', () => {
    assert.ok(PATTERN_IDS.includes('solid'));
    assert.ok(PATTERN_IDS.includes('stripes-d'));
    assert.ok(PATTERN_IDS.includes('gradient-radial'));
    assert.ok(PATTERN_IDS.includes('dots'));
    assert.ok(PATTERN_IDS.includes('checkers'));
    assert.ok(PATTERN_IDS.includes('chevron'));
    assert.ok(PATTERN_IDS.includes('hearts'));
    assert.ok(PATTERN_IDS.includes('stars'));
    assert.equal(designNeedsPlus(defaultDesign()), false);
    assert.equal(designNeedsPlus({ ...defaultDesign(), motion: 'wave' }), true);
    assert.equal(designNeedsPlus({ ...defaultDesign(), metal: 'gold' }), true);
    assert.equal(designNeedsPlus({ ...defaultDesign(), colorA: 'rose-gold' }), true);
    assert.equal(MOTION_CHOICES.length, 5);
    assert.equal(METAL_CHOICES.length, 6);
  });

  it('drops shine and motion when Diary Plus is off', () => {
    const design = { ...defaultDesign(), colorA: 'gold', colorB: 'silver', motion: 'flow' as const, metal: 'chrome' as const };
    const shown = visibleDesign(design, false);
    assert.ok(shown);
    assert.equal(shown.motion, 'none');
    assert.equal(shown.metal, 'none');
    assert.equal(shown.colorA, FREE_SWATCHES[0]);
    assert.equal(shown.colorB, FREE_SWATCHES[1]);
    assert.equal(visibleDesign(design, true)?.metal, 'chrome');
    assert.equal(swatchHex('gold'), '#D4A017');
    assert.equal(activeMetal(design), 'chrome');
  });

  it('paints the theme from the two colors and stays still when motion is reduced', () => {
    const painted = applyDesign(getTheme('cutesy'), { ...defaultDesign(), colorA: '#1C3F6E', colorB: '#F2C14E' }, false);
    assert.equal(painted.design?.pattern, 'gradient-linear');
    assert.equal(painted.colors.bg, '#1C3F6E');
    assert.equal(painted.colors.accent, '#F2C14E');
    assert.equal(painted.colors.ink, '#F7F1E8');
    assert.equal(applyDesign(getTheme('cutesy'), null, true).design, null);
    assert.equal(shouldAnimate(defaultDesign(), false), false);
    assert.equal(shouldAnimate({ ...defaultDesign(), motion: 'shimmer' }, false), true);
    assert.equal(shouldAnimate({ ...defaultDesign(), motion: 'shimmer' }, true), false);
    assert.equal(shouldAnimate({ ...defaultDesign(), metal: 'holo' }, true), false);
    assert.equal(isHexColor(hslToHex(200, 60, 50)), true);
  });
});
