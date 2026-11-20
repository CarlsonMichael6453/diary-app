import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSavedDesigns } from '../src/logic/savedDesigns';
import type { DiaryEntry, Settings } from '../src/models/types';
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
  inheritedDesign,
  isHexColor,
  resolveEntryLook,
  shouldAnimate,
  swatchHex,
  visibleDesign,
  type ColorDesign,
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

  it('lets a page inherit the book design and keep its own override', () => {
    const hearts: ColorDesign = { ...defaultDesign(), pattern: 'hearts', colorA: '#E36B8A', colorB: '#F2C14E' };
    const stars: ColorDesign = { ...defaultDesign(), pattern: 'stars', colorA: '#1C3F6E', colorB: '#FFE56A' };
    const dots: ColorDesign = { ...defaultDesign(), pattern: 'dots' };
    const daily = { themeId: 'cutesy', design: hearts };
    const travel = { themeId: 'ocean', design: stars };
    assert.equal(inheritedDesign(hearts, null)?.pattern, 'hearts');
    assert.equal(resolveEntryLook(daily, { themeOverride: null, design: null }, true).design?.pattern, 'hearts');
    assert.equal(resolveEntryLook(travel, { themeOverride: null, design: null }, true).design?.pattern, 'stars');
    assert.equal(resolveEntryLook(travel, { themeOverride: null, design: null }, true).id, 'ocean');
    const custom = resolveEntryLook(daily, { themeOverride: 'goth', design: dots }, true);
    assert.equal(custom.id, 'goth');
    assert.equal(custom.design?.pattern, 'dots');
    assert.equal(resolveEntryLook({ ...daily, design: stars }, { themeOverride: 'goth', design: dots }, true).design?.pattern, 'dots');
    assert.equal(resolveEntryLook({ ...daily, design: stars }, { themeOverride: null, design: null }, true).design?.pattern, 'stars');
    assert.equal(resolveEntryLook(daily, { themeOverride: null, design: { ...dots, pattern: 'nope' as 'dots' } }, true).design?.pattern, 'hearts');
  });

  it('round-trips book and page designs through a JSON backup', () => {
    const hearts: ColorDesign = { ...defaultDesign(), pattern: 'hearts' };
    const stripes: ColorDesign = { ...defaultDesign(), pattern: 'stripes-v', colorA: 'gold', colorB: 'silver', metal: 'gold' };
    const settings = {
      themeId: 'ocean' as const,
      activeBookId: 'travel',
      books: [
        { id: 'daily', title: 'Daily', themeId: 'cutesy' as const, design: hearts },
        { id: 'travel', title: 'Travel', themeId: 'ocean' as const, design: stripes },
      ],
    };
    const entry = {
      id: 'page-1',
      date: '2026-11-20',
      title: 'Away',
      body: 'The train.',
      mood: 'calm' as const,
      photos: [],
      stickers: [],
      themeOverride: 'goth' as const,
      design: { ...defaultDesign(), pattern: 'checkers' as const },
      createdAt: 1,
      updatedAt: 1,
      bookId: 'travel',
    } satisfies DiaryEntry;
    const packed = JSON.parse(JSON.stringify({ settings, entries: [entry], books: settings.books })) as {
      settings: typeof settings;
      entries: DiaryEntry[];
      books: typeof settings.books;
    };
    const restored = restoreSavedDesigns(packed.settings as Settings, packed.entries, packed.books);
    assert.equal(restored.settings.books[0]?.design?.pattern, 'hearts');
    assert.equal(restored.settings.books[1]?.design?.colorA, 'gold');
    assert.equal(restored.settings.activeBookId, 'travel');
    assert.equal(restored.settings.themeId, 'ocean');
    assert.equal(restored.entries[0]?.design?.pattern, 'checkers');
    assert.equal(restored.entries[0]?.themeOverride, 'goth');
    const broken = restoreSavedDesigns(settings as Settings, [{ ...entry, design: { pattern: 'nope' } as unknown as ColorDesign, themeOverride: 'not-a-theme' as 'goth' }]);
    assert.equal(broken.entries[0]?.design, undefined);
    assert.equal(broken.entries[0]?.themeOverride, null);
    assert.equal(getTheme(restored.settings.themeId).id, 'ocean');
  });
});
