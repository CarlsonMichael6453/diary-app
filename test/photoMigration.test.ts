import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import {
  base64ToBytes,
  bytesToBase64,
  collectPhotoKeys,
  extensionForMime,
  hasInlineBase64Photos,
  isInlineBase64Photo,
  isPhotoRef,
  makePhotoRef,
  migrateBookPhotos,
  parseDataUrl,
  photoKeyFromRef,
} from '../src/logic/photoRefs';
import type { DiaryEntry } from '../src/models/types';
import { defaultRoom, SAMPLE_FRAME, SAMPLE_HOUSE, SAMPLE_MOON } from '../src/room/edit';

function makeFakeJpegDataUrl(seed: number, rawBytesLength: number): { dataUrl: string; raw: Uint8Array } {
  const raw = new Uint8Array(rawBytesLength);
  raw[0] = 0xff;
  raw[1] = 0xd8;
  raw[2] = 0xff;
  for (let i = 3; i < rawBytesLength; i += 1) {
    raw[i] = (seed * 31 + i * 17) & 0xff;
  }
  return {
    dataUrl: `data:image/jpeg;base64,${bytesToBase64(raw)}`,
    raw,
  };
}

function makeEntry(id: string, photos: string[], withPlacements = true): DiaryEntry {
  return {
    id,
    date: '2026-11-24',
    title: `Page ${id}`,
    body: 'A memory worth keeping.',
    mood: 'happy',
    photos,
    ...(withPlacements
      ? {
          photoPlacements: photos.map((uri, index) => ({
            id: `pl-${id}-${index}`,
            uri,
            x: 0.3,
            y: 0.6,
            scale: 1,
            rotation: 0,
            frame: 'polaroid' as const,
            z: 20 + index,
          })),
        }
      : {}),
    stickers: [],
    themeOverride: null,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };
}

describe('photo storage migration', () => {
  const tempDirs: string[] = [];

  after(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('parses raster data URLs, round-trips base64 bytes, and leaves sample SVGs alone', () => {
    const sample = makeFakeJpegDataUrl(7, 1024);
    const parsed = parseDataUrl(sample.dataUrl);
    assert.ok(parsed);
    assert.equal(parsed.mime, 'image/jpeg');
    assert.deepEqual(base64ToBytes(parsed.base64), sample.raw);

    assert.equal(isInlineBase64Photo(sample.dataUrl), true);
    assert.equal(isInlineBase64Photo(SAMPLE_FRAME), false);
    assert.equal(isInlineBase64Photo('diary-photo://ph_1.jpg'), false);
    assert.equal(isPhotoRef('diary-photo://ph_1.jpg'), true);
    assert.equal(photoKeyFromRef('diary-photo://../bad'), null);
  });

  it('migrates old entries and room photos to external files while keeping every photo intact', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'diary-photos-'));
    tempDirs.push(dir);
    let nextId = 1;

    const p1 = makeFakeJpegDataUrl(1, 4096);
    const p2 = makeFakeJpegDataUrl(2, 2048);
    const p3 = {
      raw: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 9, 8, 7]),
      dataUrl: '',
    };
    p3.dataUrl = `data:image/png;base64,${bytesToBase64(p3.raw)}`;

    const room = defaultRoom();
    room.items = room.items.map((item, idx) => (idx === 6 ? { ...item, photo: p3.dataUrl } : item));

    const entries: DiaryEntry[] = [
      makeEntry('e1', [p1.dataUrl, p2.dataUrl], true),
      makeEntry('legacy-no-placements', [p2.dataUrl], false),
    ];

    assert.equal(hasInlineBase64Photos(entries, room), true);

    const writtenFiles = new Map<string, Uint8Array>();
    const result = await migrateBookPhotos({ entries, room }, async (dataUrl) => {
      const parsed = parseDataUrl(dataUrl);
      assert.ok(parsed);
      const key = `ph_${nextId++}.${extensionForMime(parsed.mime)}`;
      const bytes = base64ToBytes(parsed.base64);
      writeFileSync(join(dir, key), bytes);
      writtenFiles.set(key, bytes);
      return makePhotoRef(key);
    });

    assert.equal(result.changed, true);
    assert.equal(result.failedCount, 0);
    // p1, p2, and p3 are 3 unique payloads even though p2 appears in e1.photos, e1.photoPlacements, and legacy entry.
    assert.equal(result.migratedCount, 3);
    assert.equal(writtenFiles.size, 3);
    assert.equal(hasInlineBase64Photos(result.entries, result.room), false);

    // Old books open with every photo pointing to the exact original bytes on disk.
    const ref1 = result.entries[0].photos[0];
    const ref2 = result.entries[0].photos[1];
    assert.ok(isPhotoRef(ref1) && isPhotoRef(ref2));
    assert.equal(result.entries[0].photoPlacements?.[0]?.uri, ref1);
    assert.equal(result.entries[0].photoPlacements?.[1]?.uri, ref2);
    assert.equal(result.entries[1].photos[0], ref2);

    assert.deepEqual(new Uint8Array(readFileSync(join(dir, photoKeyFromRef(ref1)!))), p1.raw);
    assert.deepEqual(new Uint8Array(readFileSync(join(dir, photoKeyFromRef(ref2)!))), p2.raw);

    const roomPhotoRef = result.room.items[6]?.photo;
    assert.ok(isPhotoRef(roomPhotoRef));
    assert.deepEqual(new Uint8Array(readFileSync(join(dir, photoKeyFromRef(roomPhotoRef)!))), p3.raw);
    // Static sample SVG frames remain untouched.
    assert.equal(result.room.items[7]?.photo, SAMPLE_MOON);
    assert.equal(result.room.items[8]?.photo, SAMPLE_HOUSE);

    const keys = collectPhotoKeys(result.entries, result.room);
    assert.equal(keys.size, 3);

    // Running migration a second time is a no-op.
    const second = await migrateBookPhotos({ entries: result.entries, room: result.room }, async () => {
      throw new Error('Should not write again');
    });
    assert.equal(second.changed, false);
    assert.equal(second.migratedCount, 0);
  });

  it('keeps an inline photo intact if writing one photo fails', async () => {
    const p1 = makeFakeJpegDataUrl(10, 512);
    const p2 = makeFakeJpegDataUrl(11, 512);
    const entries = [makeEntry('e1', [p1.dataUrl, p2.dataUrl], true)];
    const room = defaultRoom();

    let count = 0;
    const result = await migrateBookPhotos({ entries, room }, async (dataUrl) => {
      count += 1;
      if (count === 1) throw new Error('disk full');
      assert.equal(dataUrl, p2.dataUrl);
      return 'diary-photo://ph_ok.jpg';
    });

    assert.equal(result.changed, true);
    assert.equal(result.migratedCount, 1);
    assert.equal(result.failedCount, 1);
    assert.equal(result.entries[0].photos[0], p1.dataUrl);
    assert.equal(result.entries[0].photos[1], 'diary-photo://ph_ok.jpg');
  });

  it('dramatically shrinks persisted storage size for a book with 12 photos', async () => {
    // 12 realistic compressed ~180 KB JPEG photos (~240 KB base64 each) spread across entries.
    const photos = Array.from({ length: 12 }, (_, index) => makeFakeJpegDataUrl(index + 1, 180 * 1024));
    const entries: DiaryEntry[] = [
      makeEntry('day-1', photos.slice(0, 4).map((p) => p.dataUrl), true),
      makeEntry('day-2', photos.slice(4, 8).map((p) => p.dataUrl), true),
      makeEntry('day-3', photos.slice(8, 12).map((p) => p.dataUrl), true),
    ];
    const room = defaultRoom();
    const beforeState = { settings: { bookTitle: "Michael's Diary", room }, entries, wallet: { coins: 60 } };
    const beforeBytes = Buffer.byteLength(JSON.stringify(beforeState), 'utf8');

    const blobStore = new Map<string, Uint8Array>();
    let seq = 1;
    const migrated = await migrateBookPhotos({ entries, room }, async (dataUrl) => {
      const parsed = parseDataUrl(dataUrl)!;
      const key = `ph_${seq++}.${extensionForMime(parsed.mime)}`;
      blobStore.set(key, base64ToBytes(parsed.base64));
      return makePhotoRef(key);
    });

    const afterState = {
      settings: { bookTitle: "Michael's Diary", room: migrated.room, photosMigrated: true },
      entries: migrated.entries,
      wallet: { coins: 60 },
    };
    const afterBytes = Buffer.byteLength(JSON.stringify(afterState), 'utf8');

    assert.equal(blobStore.size, 12);
    assert.ok(beforeBytes > 5_000_000, `expected >5MB before migration, got ${beforeBytes}`);
    assert.ok(afterBytes < 10_000, `expected <10KB after migration, got ${afterBytes}`);
    assert.ok(afterBytes * 500 < beforeBytes);
  });
});
