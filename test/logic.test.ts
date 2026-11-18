import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BUDDIES, OUTFITS } from '../src/buddies/catalog';
import { PROMPTS, promptForDate } from '../src/data/prompts';
import { canUseItem } from '../src/logic/access';
import { addDays, todayKey } from '../src/logic/dates';
import { pickFromPool, resolveReward, writingBonus } from '../src/logic/rewards';
import { splitHighlight } from '../src/logic/search';
import { loginProgress, writingStreak } from '../src/logic/streak';
import { drawArt } from '../src/stickers/art';
import { STICKERS } from '../src/stickers/catalog';
import { ART_KEYS } from '../src/stickers/types';

const REQUIRED_BUDDIES = ['mochi', 'batsy', 'sprout', 'glitter', 'prism', 'inky', 'pip', 'nova', 'shelly', 'ghosty', 'ember', 'lumi'];

describe('stickers', () => {
  it('has more than 100 unique stickers', () => {
    assert.ok(STICKERS.length >= 100);
    assert.equal(new Set(STICKERS.map((sticker) => sticker.id)).size, STICKERS.length);
  });

  it('draws every art key', () => {
    const palette = { main: '#111', alt: '#222', accent: '#333', detail: '#444', soft: '#555' };
    for (const key of ART_KEYS) {
      assert.ok(drawArt(key, palette).length > 0, key);
    }
  });

  it('keeps legendary stickers behind the premium unlock', () => {
    const legendary = STICKERS.filter((sticker) => sticker.rarity === 'legendary');
    assert.ok(legendary.length >= 2);
    assert.ok(legendary.every((sticker) => sticker.unlock === 'premium'));
  });
});

describe('buddies', () => {
  it('includes the starter pals, a none-compatible list, and premium pals', () => {
    for (const id of REQUIRED_BUDDIES) {
      assert.ok(BUDDIES.some((buddy) => buddy.id === id), id);
    }
    const premium = BUDDIES.filter((buddy) => buddy.premium).map((buddy) => buddy.id);
    assert.ok(premium.includes('ember'));
    assert.ok(premium.includes('lumi'));
    assert.ok(OUTFITS.length >= 8);
  });
});

describe('search and dates', () => {
  it('highlights every match without dropping text', () => {
    const parts = splitHighlight('Rain on the window', 'rain');
    assert.deepEqual(parts.map((part) => part.text).join(''), 'Rain on the window');
    assert.equal(parts.filter((part) => part.hit).length, 1);
  });

  it('keeps the prompt stable for a date', () => {
    assert.ok(PROMPTS.length >= 80);
    assert.equal(promptForDate('2026-11-18'), promptForDate('2026-11-18'));
  });

  it('counts a writing streak through today and pauses on a gap', () => {
    const today = todayKey();
    assert.equal(writingStreak([today, addDays(today, -1), addDays(today, -2)]), 3);
    assert.equal(writingStreak([addDays(today, -2)]), 0);
    assert.equal(writingStreak([addDays(today, -1)]), 1);
  });
});

describe('rewards and access', () => {
  it('lets coins unlock owned rares and keeps premium locked', () => {
    const rare = STICKERS.find((sticker) => sticker.unlock === 'coins' && sticker.rarity === 'rare');
    const legendary = STICKERS.find((sticker) => sticker.rarity === 'legendary');
    assert.ok(rare && legendary);
    assert.equal(canUseItem(rare, { ownedIds: [rare.id], premium: false }), true);
    assert.equal(canUseItem(legendary, { ownedIds: [], premium: false }), false);
    assert.equal(canUseItem(legendary, { ownedIds: [], premium: true }), true);
  });

  it('does not hand out legendary stickers from the game pool', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const id = pickFromPool(STICKERS, 'rare', () => i / 30);
      if (id) ids.add(id);
    }
    for (const id of ids) {
      assert.notEqual(STICKERS.find((sticker) => sticker.id === id)?.rarity, 'legendary');
    }
  });

  it('pays a bigger writing bonus as the streak grows', () => {
    assert.ok(writingBonus(7) > writingBonus(1));
    const resolved = resolveReward(
      { coins: 5, stickerRarity: 'common', title: 't', detail: 'd' },
      STICKERS,
      [],
      [],
      () => 0,
    );
    assert.ok(resolved.stickerId || resolved.coins >= 5);
  });

  it('advances the login ribbon only once per day', () => {
    const today = '2026-11-18';
    const fresh = loginProgress(null, 0, today);
    assert.equal(fresh.claimed, false);
    assert.equal(fresh.nextStreak, 1);
    const again = loginProgress(today, 1, today);
    assert.equal(again.claimed, true);
    const next = loginProgress(today, 1, addDays(today, 1));
    assert.equal(next.nextStreak, 2);
  });
});
