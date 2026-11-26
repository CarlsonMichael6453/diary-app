import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, bytesToUtf8, hexToBytes, randomBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

/** Backups made before rounds were recorded in the file used this many. */
export const LEGACY_BACKUP_ROUNDS = 20_000;
/** New backups. Raise this if a test phone seals a backup in well under a second. */
export const BACKUP_ROUNDS = 200_000;
/** The passcode is only four digits, so this slows guessing but cannot stop an offline attack. */
const PIN_ROUNDS = 100_000;

function concat(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
}

function fromBase64(value: string): Uint8Array {
  const raw = atob(value);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function encryptString(plain: string, key: Uint8Array): string {
  const nonce = randomBytes(12);
  const cipher = gcm(key, nonce);
  const sealed = cipher.encrypt(utf8ToBytes(plain));
  return toBase64(concat([nonce, sealed]));
}

export function decryptString(payload: string, key: Uint8Array): string {
  const bytes = fromBase64(payload);
  const nonce = bytes.slice(0, 12);
  const sealed = bytes.slice(12);
  const cipher = gcm(key, nonce);
  return bytesToUtf8(cipher.decrypt(sealed));
}

export function deriveBackupKey(passphrase: string, salt: Uint8Array, rounds: number = BACKUP_ROUNDS): Uint8Array {
  return pbkdf2(sha256, utf8ToBytes(passphrase), salt, { c: rounds, dkLen: 32 });
}

export function encryptWithPassphrase(plain: string, passphrase: string): { salt: string; payload: string; rounds: number } {
  const salt = randomBytes(16);
  const key = deriveBackupKey(passphrase, salt, BACKUP_ROUNDS);
  return { salt: bytesToHex(salt), payload: encryptString(plain, key), rounds: BACKUP_ROUNDS };
}

export function decryptWithPassphrase(payload: string, saltHex: string, passphrase: string, rounds: number = LEGACY_BACKUP_ROUNDS): string {
  const key = deriveBackupKey(passphrase, hexToBytes(saltHex), rounds);
  return decryptString(payload, key);
}

/** Salted, slow hash for the four-digit passcode. */
export function derivePinHash(pin: string, salt: Uint8Array): Uint8Array {
  return pbkdf2(sha256, utf8ToBytes(`diary-app:${pin}`), salt, { c: PIN_ROUNDS, dkLen: 32 });
}

export function newSalt(): Uint8Array {
  return randomBytes(16);
}

/** Compares without stopping at the first differing character. */
export function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomKey(): Uint8Array {
  return randomBytes(32);
}

export { bytesToHex, hexToBytes };
