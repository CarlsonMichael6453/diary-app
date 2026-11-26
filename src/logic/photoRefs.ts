import type { DiaryEntry } from '../models/types';
import type { PalRoom } from '../room/edit';

export const PHOTO_REF_PREFIX = 'diary-photo://';

const DATA_IMAGE_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i;

export function isPhotoRef(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && uri.startsWith(PHOTO_REF_PREFIX) && photoKeyFromRef(uri) !== null;
}

export function photoKeyFromRef(ref: string): string | null {
  if (!ref.startsWith(PHOTO_REF_PREFIX)) return null;
  const key = ref.slice(PHOTO_REF_PREFIX.length);
  if (!key || !/^[a-zA-Z0-9._-]+$/.test(key) || key.includes('..')) return null;
  return key;
}

export function makePhotoRef(key: string): string {
  return `${PHOTO_REF_PREFIX}${key}`;
}

export function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = DATA_IMAGE_RE.exec(dataUrl.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  // Skip inline SVGs (such as the static room frame samples); only migrate raster photo payloads.
  if (mime === 'image/svg+xml') return null;
  const base64 = match[2].replace(/\s+/g, '');
  if (!base64) return null;
  return { mime, base64 };
}

export function isInlineBase64Photo(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && parseDataUrl(uri) !== null;
}

export function extensionForMime(mime: string): string {
  const lower = mime.toLowerCase();
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('gif')) return 'gif';
  if (lower.includes('heic')) return 'heic';
  if (lower.includes('heif')) return 'heif';
  return 'jpg';
}

export function mimeForExtension(ext: string): string {
  const lower = ext.toLowerCase().replace(/^\./, '');
  if (lower === 'png') return 'image/png';
  if (lower === 'webp') return 'image/webp';
  if (lower === 'gif') return 'image/gif';
  if (lower === 'heic') return 'image/heic';
  if (lower === 'heif') return 'image/heif';
  return 'image/jpeg';
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = (() => {
  const table = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64_ALPHABET.length; i += 1) {
    table[B64_ALPHABET.charCodeAt(i)] = i;
  }
  table['-'.charCodeAt(0)] = 62;
  table['_'.charCodeAt(0)] = 63;
  return table;
})();

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '').replace(/=+$/, '');
  const outLength = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(outLength);
  let outIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64_LOOKUP[clean.charCodeAt(i)] ?? 0;
    const b = B64_LOOKUP[clean.charCodeAt(i + 1)] ?? 0;
    const c = i + 2 < clean.length ? (B64_LOOKUP[clean.charCodeAt(i + 2)] ?? -1) : -1;
    const d = i + 3 < clean.length ? (B64_LOOKUP[clean.charCodeAt(i + 3)] ?? -1) : -1;
    if (a < 0 || b < 0) continue;
    out[outIndex++] = (a << 2) | (b >> 4);
    if (c >= 0 && outIndex < outLength) {
      out[outIndex++] = ((b & 0x0f) << 4) | (c >> 2);
      if (d >= 0 && outIndex < outLength) {
        out[outIndex++] = ((c & 0x03) << 6) | d;
      }
    }
  }
  return out.subarray(0, outIndex);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (a << 16) | (b << 8) | c;
    out += B64_ALPHABET[(triplet >> 18) & 0x3f];
    out += B64_ALPHABET[(triplet >> 12) & 0x3f];
    out += i + 1 < bytes.length ? B64_ALPHABET[(triplet >> 6) & 0x3f] : '=';
    out += i + 2 < bytes.length ? B64_ALPHABET[triplet & 0x3f] : '=';
  }
  return out;
}

export function hasInlineBase64Photos(entries: readonly DiaryEntry[], room?: PalRoom | null): boolean {
  for (const entry of entries) {
    if (entry.photos.some((uri) => isInlineBase64Photo(uri))) return true;
    if (entry.photoPlacements?.some((photo) => isInlineBase64Photo(photo.uri))) return true;
  }
  if (room?.items.some((item) => isInlineBase64Photo(item.photo))) return true;
  return false;
}

export function collectPhotoKeys(entries: readonly DiaryEntry[], room?: PalRoom | null): Set<string> {
  const keys = new Set<string>();
  const add = (uri: string | null | undefined) => {
    if (!uri) return;
    const key = photoKeyFromRef(uri);
    if (key) keys.add(key);
  };
  for (const entry of entries) {
    for (const uri of entry.photos) add(uri);
    for (const placement of entry.photoPlacements ?? []) add(placement.uri);
  }
  for (const item of room?.items ?? []) add(item.photo);
  return keys;
}

export type PhotoWriter = (dataUrl: string) => Promise<string>;

export type PhotoMigrationResult = {
  entries: DiaryEntry[];
  room: PalRoom;
  migratedCount: number;
  failedCount: number;
  changed: boolean;
};

/**
 * Moves inline base64 photo payloads out of entries and room frames into external
 * photo storage, leaving lightweight `diary-photo://<key>` references behind.
 * Deduplicates identical inline payloads within a pass so `entry.photos` and
 * `entry.photoPlacements` share a single stored file/record.
 */
export async function migrateBookPhotos(
  input: { entries: readonly DiaryEntry[]; room: PalRoom },
  writePhoto: PhotoWriter,
): Promise<PhotoMigrationResult> {
  const inFlight = new Map<string, Promise<string | null>>();
  let migratedCount = 0;
  let failedCount = 0;
  let changed = false;

  const migrateUri = async (uri: string): Promise<string> => {
    if (!isInlineBase64Photo(uri)) return uri;
    let task = inFlight.get(uri);
    if (!task) {
      task = writePhoto(uri)
        .then((ref) => {
          migratedCount += 1;
          return ref;
        })
        .catch(() => {
          failedCount += 1;
          return null;
        });
      inFlight.set(uri, task);
    }
    const next = await task;
    if (next && next !== uri) {
      changed = true;
      return next;
    }
    return uri;
  };

  const entries: DiaryEntry[] = await Promise.all(
    input.entries.map(async (entry) => {
      const hasInline =
        entry.photos.some((uri) => isInlineBase64Photo(uri)) ||
        Boolean(entry.photoPlacements?.some((photo) => isInlineBase64Photo(photo.uri)));
      if (!hasInline) return entry;

      const photos = await Promise.all(entry.photos.map(migrateUri));
      const photoPlacements = entry.photoPlacements
        ? await Promise.all(
            entry.photoPlacements.map(async (placement) => ({
              ...placement,
              uri: await migrateUri(placement.uri),
            })),
          )
        : undefined;

      return {
        ...entry,
        photos,
        ...(photoPlacements ? { photoPlacements } : {}),
      };
    }),
  );

  const hasRoomInline = input.room.items.some((item) => isInlineBase64Photo(item.photo));
  const room: PalRoom = hasRoomInline
    ? {
        ...input.room,
        items: await Promise.all(
          input.room.items.map(async (item) =>
            isInlineBase64Photo(item.photo) ? { ...item, photo: await migrateUri(item.photo) } : item,
          ),
        ),
      }
    : input.room;

  return { entries, room, migratedCount, failedCount, changed };
}
