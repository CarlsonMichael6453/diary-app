import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { entriesToCsv, openSealedBackup, parseImport, sealBackup, weatherUrl } from '../src/logic/backup';
import { decryptString, encryptString, randomKey } from '../src/logic/crypto';
import { healthMoodNotes } from '../src/logic/health';
import { backupIsDue, memoriesOnThisDay } from '../src/logic/memories';
import { SAYINGS, inQuietHours, pickSaying } from '../src/logic/sayings';
import { goodDayNotes, yearPixels } from '../src/logic/stats';
import { TEMPLATES } from '../src/logic/templates';
import { isShake, isWiggle } from '../src/logic/motion';
import { packIsOwned, packOffer } from '../src/logic/packs';
import { widgetCards } from '../src/logic/widgets';

describe('library', () => {
  it('encrypts text so the diary words are not readable', () => {
    const key = randomKey();
    const secret = 'UNIQUE_TITLE_zz stayed on the page';
    const sealed = encryptString(secret, key);
    assert.equal(sealed.includes('UNIQUE_TITLE_zz'), false);
    assert.equal(decryptString(sealed, key), secret);
  });

  it('seals a backup with a passphrase and refuses the wrong one', () => {
    const json = JSON.stringify({ title: 'UNIQUE_BODY_zz' });
    const file = sealBackup(json, 'ink-1234');
    assert.equal(file.includes('UNIQUE_BODY_zz'), false);
    assert.equal(openSealedBackup(file, 'ink-1234'), json);
    assert.throws(() => openSealedBackup(file, 'nope'));
  });

  it('remembers other years on this day and when a backup is due', () => {
    const memories = memoriesOnThisDay(
      [
        { id: 'a', date: '2024-11-19' },
        { id: 'b', date: '2025-11-19' },
        { id: 'c', date: '2026-11-19' },
      ],
      '2026-11-19',
    );
    assert.deepEqual(memories.map((item) => item.yearsAgo), [1, 2]);
    assert.equal(backupIsDue(null, '2026-11-19', 14), true);
    assert.equal(backupIsDue('2026-11-18T00:00:00.000Z', '2026-11-19', 14), false);
  });

  it('builds a year grid, good-day notes, and a csv without dropping commas', () => {
    const pixels = yearPixels([{ date: '2024-01-02', mood: 'happy' }], 2024);
    assert.equal(pixels.length, 366);
    assert.equal(pixels[1].mood, 'happy');
    const notes = goodDayNotes([
      { date: '2026-01-01', mood: 'happy', activities: ['walk'] },
      { date: '2026-01-02', mood: 'happy', activities: ['walk'] },
      { date: '2026-01-03', mood: 'sad', activities: ['work'] },
    ]);
    assert.ok(notes.some((note) => note.includes('walk')));
    const csv = entriesToCsv([{ id: '1', date: '2026-01-01', title: 'Hello, world', body: 'line\ntwo', mood: 'calm' }]);
    assert.match(csv, /"Hello, world"/);
    assert.match(csv, /"line\ntwo"/);
  });

  it('imports Day One JSON and Daylio CSV', () => {
    const dayOne = parseImport(JSON.stringify({ entries: [{ text: 'Ferry lights', creationDate: '2024-05-01T10:00:00Z', tags: ['travel'] }] }));
    assert.equal(dayOne.source, 'day-one');
    assert.equal(dayOne.entries[0].body, 'Ferry lights');
    const daylio = parseImport('full_date,mood,activities,note\n2024-02-03,good,walk|friends,Sunny pier');
    assert.equal(daylio.source, 'daylio');
    assert.equal(daylio.entries[0].mood, 'happy');
    assert.ok(daylio.entries[0].tags?.includes('walk'));
  });

  it('keeps weather requests free of diary text and rotates pal sayings', () => {
    const url = weatherUrl(47.6, -122.3);
    assert.match(url, /open-meteo\.com/);
    assert.equal(url.includes('UNIQUE_TITLE_zz'), false);
    assert.ok(SAYINGS.length >= 50);
    assert.ok(TEMPLATES.some((template) => template.id === 'gratitude'));
    let previous: string | null = null;
    for (let i = 0; i < 20; i += 1) {
      const next = pickSaying(previous, 'mochi', () => 0);
      assert.notEqual(next.id, previous);
      previous = next.id;
    }
    assert.equal(inQuietHours(23, 22, 7), true);
    assert.equal(inQuietHours(12, 22, 7), false);
    const cards = widgetCards({ buddyName: 'Mochi', buddyEmoji: '🐱', streak: 3, wroteToday: false, saying: 'I miss you!' });
    assert.equal(cards.length, 4);
    assert.match(cards[3].body, /I miss you!/);
    assert.equal(packOffer({ id: 'neon', name: 'Neon', blurb: '', premium: false, swatch: '#000', coinPrice: 90 }).kind, 'coins');
    assert.equal(packOffer({ id: 'witchy', name: 'Witchy', blurb: '', premium: true, swatch: '#000' }).kind, 'premium');
    assert.equal(packIsOwned({ id: 'spark', name: 'Spark', blurb: '', premium: false, swatch: '#000' }, [], false), true);
    assert.equal(packIsOwned({ id: 'neon', name: 'Neon', blurb: '', premium: false, swatch: '#000', coinPrice: 90 }, ['neon'], false), true);
    const wiggle = [
      { t: 0, x: 0 },
      { t: 40, x: 40 },
      { t: 80, x: 0 },
      { t: 120, x: 40 },
      { t: 160, x: 0 },
      { t: 200, x: 40 },
    ];
    assert.equal(isWiggle(wiggle, 200), true);
    assert.equal(isShake([{ t: 0, x: 0 }, { t: 50, x: 2 }, { t: 100, x: 0 }, { t: 150, x: 2 }, { t: 200, x: 0 }], 200), true);
  });

  it('notices kinder moods after more steps', () => {
    const notes = healthMoodNotes([
      { date: '2026-01-01', steps: 1000, mood: 'sad' },
      { date: '2026-01-02', steps: 2000, mood: 'sad' },
      { date: '2026-01-03', steps: 8000, mood: 'happy' },
      { date: '2026-01-04', steps: 9000, mood: 'happy' },
    ]);
    assert.ok(notes.some((note) => note.includes('walk')));
  });
});
