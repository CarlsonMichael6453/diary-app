import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { uid } from '../logic/id';
import {
  base64ToBytes,
  bytesToBase64,
  collectPhotoKeys,
  extensionForMime,
  isPhotoRef,
  makePhotoRef,
  mimeForExtension,
  parseDataUrl,
  photoKeyFromRef,
} from '../logic/photoRefs';
import type { DiaryEntry } from '../models/types';
import type { PalRoom } from '../room/edit';

const DB_NAME = 'diary-app-photos';
const STORE_NAME = 'photos';
const DB_VERSION = 1;
const NATIVE_DIR_NAME = 'diary-photos';

type StoredWebPhoto = {
  key: string;
  buffer: ArrayBuffer;
  mime: string;
};

const resolvedCache = new Map<string, string>();
const inflightResolves = new Map<string, Promise<string | null>>();
const memoryFallback = new Map<string, StoredWebPhoto>();
let dbPromise: Promise<IDBDatabase | null> | null = null;
let nativeDirPromise: Promise<string> | null = null;

function openPhotoDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });
  return dbPromise;
}

async function idbPut(record: StoredWebPhoto): Promise<void> {
  const db = await openPhotoDb();
  if (!db) {
    memoryFallback.set(record.key, record);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to store photo in IndexedDB.'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

async function idbGet(key: string): Promise<StoredWebPhoto | null> {
  const db = await openPhotoDb();
  if (!db) return memoryFallback.get(key) ?? null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as StoredWebPhoto | undefined) ?? memoryFallback.get(key) ?? null);
    req.onerror = () => resolve(memoryFallback.get(key) ?? null);
  });
}

async function idbPrune(keepKeys: Set<string>): Promise<void> {
  for (const key of Array.from(memoryFallback.keys())) {
    if (!keepKeys.has(key)) memoryFallback.delete(key);
  }
  const db = await openPhotoDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => {
      const keys = (req.result as IDBValidKey[]) ?? [];
      for (const rawKey of keys) {
        const key = String(rawKey);
        if (!keepKeys.has(key)) {
          store.delete(rawKey);
          const ref = makePhotoRef(key);
          const cached = resolvedCache.get(ref);
          if (cached?.startsWith('blob:') && typeof URL !== 'undefined') URL.revokeObjectURL(cached);
          resolvedCache.delete(ref);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

function webUrlFromRecord(record: StoredWebPhoto): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined') {
    return URL.createObjectURL(new Blob([record.buffer], { type: record.mime }));
  }
  return `data:${record.mime};base64,${bytesToBase64(new Uint8Array(record.buffer))}`;
}

async function ensureNativeDir(): Promise<string> {
  if (nativeDirPromise) return nativeDirPromise;
  nativeDirPromise = (async () => {
    const FileSystem = await import('expo-file-system/legacy');
    const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    if (!base) throw new Error('No writable document directory is available for photos.');
    const dir = `${base}${NATIVE_DIR_NAME}/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    return dir;
  })();
  return nativeDirPromise;
}

function extFromUri(uri: string, mimeType?: string | null): string {
  if (mimeType) return extensionForMime(mimeType);
  const clean = uri.split('?')[0]?.split('#')[0] ?? '';
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  const ext = match?.[1]?.toLowerCase();
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'jpg';
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/** Saves an inline `data:image/...;base64,...` photo and returns a `diary-photo://` reference. */
export async function savePhotoDataUrl(dataUrl: string): Promise<string> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error('Invalid inline photo payload.');
  const ext = extensionForMime(parsed.mime);
  const key = `${uid('ph')}.${ext}`;
  const ref = makePhotoRef(key);

  if (Platform.OS === 'web') {
    const bytes = base64ToBytes(parsed.base64);
    const record: StoredWebPhoto = { key, buffer: toArrayBuffer(bytes), mime: parsed.mime };
    await idbPut(record);
    resolvedCache.set(ref, webUrlFromRecord(record));
    return ref;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const dir = await ensureNativeDir();
  const target = `${dir}${key}`;
  await FileSystem.writeAsStringAsync(target, parsed.base64, { encoding: FileSystem.EncodingType.Base64 });
  resolvedCache.set(ref, target);
  return ref;
}

/** Saves a Blob/File picked on the web into IndexedDB and returns a `diary-photo://` reference. */
export async function savePhotoBlob(blob: Blob): Promise<string> {
  const mime = blob.type || 'image/jpeg';
  const key = `${uid('ph')}.${extensionForMime(mime)}`;
  const ref = makePhotoRef(key);
  const buffer = await blob.arrayBuffer();
  const record: StoredWebPhoto = { key, buffer, mime };
  await idbPut(record);
  resolvedCache.set(ref, webUrlFromRecord(record));
  return ref;
}

/** Saves an ImagePicker asset to external photo storage and returns a `diary-photo://` reference. */
export async function savePickedPhoto(input: { uri?: string | null; base64?: string | null; mimeType?: string | null }): Promise<string | null> {
  if (input.base64) {
    const mime = input.mimeType ?? 'image/jpeg';
    return savePhotoDataUrl(`data:${mime};base64,${input.base64}`);
  }
  const uri = input.uri ?? '';
  if (!uri) return null;
  if (parseDataUrl(uri)) return savePhotoDataUrl(uri);

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return savePhotoBlob(blob);
  }

  const FileSystem = await import('expo-file-system/legacy');
  const dir = await ensureNativeDir();
  const ext = extFromUri(uri, input.mimeType);
  const key = `${uid('ph')}.${ext}`;
  const target = `${dir}${key}`;
  await FileSystem.copyAsync({ from: uri, to: target });
  const ref = makePhotoRef(key);
  resolvedCache.set(ref, target);
  return ref;
}

export function getCachedPhotoUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  if (!isPhotoRef(uri)) return uri;
  return resolvedCache.get(uri) ?? null;
}

/** Resolves a `diary-photo://` reference to a platform-renderable URI (`file://` on native, `blob:` on web). */
export async function resolvePhotoUri(uri: string): Promise<string | null> {
  if (!isPhotoRef(uri)) return uri;
  const cached = resolvedCache.get(uri);
  if (cached) return cached;

  const existing = inflightResolves.get(uri);
  if (existing) return existing;

  const task = (async () => {
    const key = photoKeyFromRef(uri);
    if (!key) return null;

    if (Platform.OS === 'web') {
      const record = await idbGet(key);
      if (!record) return null;
      const url = webUrlFromRecord({ ...record, mime: record.mime || mimeForExtension(key.split('.').pop() ?? 'jpg') });
      resolvedCache.set(uri, url);
      return url;
    }

    const dir = await ensureNativeDir();
    const target = `${dir}${key}`;
    resolvedCache.set(uri, target);
    return target;
  })().finally(() => {
    inflightResolves.delete(uri);
  });

  inflightResolves.set(uri, task);
  return task;
}

export async function pruneUnusedPhotos(entries: readonly DiaryEntry[], room?: PalRoom | null): Promise<void> {
  const keep = collectPhotoKeys(entries, room);
  if (Platform.OS === 'web') {
    await idbPrune(keep);
    return;
  }
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const dir = await ensureNativeDir();
    const names = await FileSystem.readDirectoryAsync(dir);
    for (const name of names) {
      if (!keep.has(name)) {
        await FileSystem.deleteAsync(`${dir}${name}`, { idempotent: true });
        resolvedCache.delete(makePhotoRef(name));
      }
    }
  } catch {
    // Best-effort cleanup only.
  }
}

export function usePhotoUri(uri: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(() => getCachedPhotoUri(uri));

  useEffect(() => {
    const immediate = getCachedPhotoUri(uri);
    setResolved(immediate);
    if (!uri || immediate) return;
    let active = true;
    void resolvePhotoUri(uri).then((next) => {
      if (active && next) setResolved(next);
    });
    return () => {
      active = false;
    };
  }, [uri]);

  return resolved;
}
