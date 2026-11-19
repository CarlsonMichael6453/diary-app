import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { packIsOwned, packOffer } from '../src/logic/packs';
import {
  arrivingLabel,
  birthdayFrom,
  easterSunday,
  holidaySpan,
  isDateKey,
  leavingLabel,
  openSeasons,
  packOnSale,
  seasonArrivals,
  shopToday,
  shopWindow,
  upcomingSeasons,
} from '../src/logic/seasons';
import { getSticker, stickersInPack } from '../src/stickers/catalog';
import { SEASONAL_PACKS } from '../src/stickers/seasonal';

describe('seasonal calendar', () => {
  it('computes Easter, Thanksgiving, and the May and June Sundays', () => {
    assert.equal(easterSunday(2024), '2024-03-31');
    assert.equal(easterSunday(2025), '2025-04-20');
    assert.equal(easterSunday(2026), '2026-04-05');
    assert.equal(easterSunday(2027), '2027-03-28');
    assert.equal(holidaySpan('thanksgiving', 2025)?.start, '2025-11-27');
    assert.equal(holidaySpan('thanksgiving', 2026)?.start, '2026-11-26');
    assert.equal(holidaySpan('mothers-day', 2026)?.start, '2026-05-10');
    assert.equal(holidaySpan('fathers-day', 2026)?.start, '2026-06-21');
  });

  it('uses lookup dates for Lunar New Year, Diwali, and Hanukkah', () => {
    assert.equal(holidaySpan('lunar-new-year', 2026)?.start, '2026-02-17');
    assert.equal(holidaySpan('diwali', 2026)?.start, '2026-11-08');
    assert.equal(holidaySpan('hanukkah', 2026)?.start, '2026-12-04');
    assert.equal(holidaySpan('hanukkah', 2032)?.start, '2032-11-27');
    assert.equal(holidaySpan('diwali', 2045), null);
  });

  it('opens a pack from about 18 days before through 7 days after', () => {
    const christmas = shopWindow('christmas', 2026);
    assert.equal(christmas?.start, '2026-12-07');
    assert.equal(christmas?.end, '2027-01-01');
    assert.equal(packOnSale('christmas', '2026-12-20', null), true);
    assert.equal(packOnSale('christmas', '2027-01-01', null), true);
    assert.equal(packOnSale('christmas', '2026-11-01', null), false);
    assert.equal(packOnSale('christmas', '2027-12-20', null), true);
    assert.equal(packOnSale('lunar-new-year', '2026-02-01', null), true);
    assert.equal(packOnSale('lunar-new-year', '2026-01-01', null), false);
  });

  it('keeps New Year open across the year boundary', () => {
    assert.equal(packOnSale('new-year', '2026-12-20', null), true);
    assert.equal(packOnSale('new-year', '2027-01-05', null), true);
    assert.equal(packOnSale('new-year', '2026-11-19', null), false);
  });

  it('lists what is in the shop on 19 November 2026, soonest departure first', () => {
    const open = openSeasons('2026-11-19', null);
    assert.deepEqual(open.map((slot) => slot.packId), ['diwali', 'thanksgiving', 'hanukkah']);
    assert.equal(leavingLabel(open[0].days), 'Leaves today');
    assert.equal(leavingLabel(open[1].days), 'Leaving in 14 days');
    const soon = upcomingSeasons('2026-11-19', null, 4).map((slot) => slot.packId);
    assert.deepEqual(soon, ['christmas', 'kwanzaa', 'new-year', 'lunar-new-year']);
    assert.equal(arrivingLabel(upcomingSeasons('2026-11-19', null, 1)[0].days), 'Arrives in 18 days');
  });

  it('unlocks the birthday pack only during that birthday week', () => {
    const birthday = birthdayFrom(3, 10);
    assert.ok(birthday);
    const week = holidaySpan('birthday', 2026, birthday);
    assert.equal(week?.start, '2026-03-08');
    assert.equal(week?.end, '2026-03-14');
    assert.equal(packOnSale('birthday', '2026-03-08', birthday), true);
    assert.equal(packOnSale('birthday', '2026-03-14', birthday), true);
    assert.equal(packOnSale('birthday', '2026-03-07', birthday), false);
    assert.equal(packOnSale('birthday', '2026-03-15', birthday), false);
    assert.equal(packOnSale('birthday', '2026-03-10', null), false);
    assert.equal(holidaySpan('birthday', 2027, birthdayFrom(2, 29))?.start, '2027-02-28');
  });

  it('announces a pack only in the first three shop days', () => {
    const fresh = seasonArrivals('2026-11-16', null, []);
    assert.equal(fresh.some((item) => item.packId === 'hanukkah'), true);
    const again = seasonArrivals('2026-11-16', null, fresh.map((item) => item.key));
    assert.equal(again.some((item) => item.packId === 'hanukkah'), false);
    assert.equal(seasonArrivals('2026-11-19', null, []).some((item) => item.packId === 'hanukkah'), false);
  });

  it('accepts a real preview date and ignores a broken one', () => {
    assert.equal(isDateKey('2026-12-20'), true);
    assert.equal(isDateKey('2026-02-31'), false);
    assert.equal(shopToday('2026-12-20', new Date(2026, 10, 19)), '2026-12-20');
    assert.equal(shopToday('nope', new Date(2026, 10, 19)), '2026-11-19');
    assert.equal(birthdayFrom(2, 31), null);
    assert.equal(birthdayFrom(2, 29)?.day, 29);
  });
});

describe('seasonal packs', () => {
  it('replaces the generic holiday pack with themed packs of 8 to 12 stickers', () => {
    const ids = SEASONAL_PACKS.map((pack) => pack.id);
    assert.equal(ids.includes('holiday'), false);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes('new-year') && ids.includes('birthday') && ids.includes('dia-de-muertos'));
    assert.ok(SEASONAL_PACKS.filter((pack) => pack.premium).length >= 4);
    assert.ok(SEASONAL_PACKS.filter((pack) => !pack.premium && pack.coinPrice).length >= 4);
    for (const pack of SEASONAL_PACKS) {
      const stickers = stickersInPack(pack.id);
      assert.ok(stickers.length >= 8 && stickers.length <= 12, pack.id);
      assert.ok(stickers.filter((sticker) => sticker.rarity === 'rare' || sticker.rarity === 'epic').length >= 2, pack.id);
      assert.equal(packOffer(pack).kind, pack.premium ? 'premium' : 'coins');
    }
    assert.ok(getSticker('holiday-winter-star'));
  });

  it('keeps a seasonal Plus pack locked until it is owned, even with Diary Plus', () => {
    const christmas = SEASONAL_PACKS.find((pack) => pack.id === 'christmas');
    const mothers = SEASONAL_PACKS.find((pack) => pack.id === 'mothers-day');
    assert.ok(christmas && mothers);
    assert.equal(packIsOwned(christmas, [], true), false);
    assert.equal(packIsOwned(christmas, ['christmas'], false), true);
    assert.equal(packIsOwned(mothers, ['mothers-day'], false), true);
  });
});
