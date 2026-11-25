import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bytesToHex, derivePinHash, hexToBytes, newSalt, sameHex } from '../logic/crypto';
import { EMPTY_LOCKOUT, lockRemainingMs, parseLockout, recordFailure, type LockoutState } from '../logic/lockout';

const KEY = 'diary.passcode.hash';
const LOCK_KEY = 'diary.passcode.lockout';
const V2 = 'v2$';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') await AsyncStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

/** Stored as `v2$<salt>$<hash>`. A bare 64-character value is the old unsalted hash. */
async function hashPin(pin: string): Promise<string> {
  const salt = newSalt();
  return `${V2}${bytesToHex(salt)}$${bytesToHex(derivePinHash(pin, salt))}`;
}

async function legacyHash(pin: string): Promise<string> {
  const Crypto = await import('expo-crypto');
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `diary-app:${pin}`);
}

async function matches(stored: string, pin: string): Promise<boolean> {
  if (stored.startsWith(V2)) {
    const [, saltHex, hashHex] = stored.split('$');
    if (!saltHex || !hashHex) return false;
    return sameHex(bytesToHex(derivePinHash(pin, hexToBytes(saltHex))), hashHex);
  }
  return sameHex(stored, await legacyHash(pin));
}

async function readLockout(): Promise<LockoutState> {
  return parseLockout(await getItem(LOCK_KEY));
}

async function writeLockout(state: LockoutState) {
  if (state.failures === 0 && state.lockedUntil === 0) await removeItem(LOCK_KEY);
  else await setItem(LOCK_KEY, JSON.stringify(state));
}

export async function savePasscode(pin: string): Promise<void> {
  await setItem(KEY, await hashPin(pin));
  await writeLockout(EMPTY_LOCKOUT);
}

export type PasscodeResult = { ok: true } | { ok: false; lockedMs: number };

/**
 * Checks the passcode and keeps count of misses. After five misses the pad waits
 * 30 seconds, then longer each time. The wait uses the phone clock, so it slows
 * guessing but cannot stop someone who can change the clock or read the web storage.
 */
export async function verifyPasscode(pin: string): Promise<PasscodeResult> {
  const now = Date.now();
  const state = await readLockout();
  const wait = lockRemainingMs(state, now);
  if (wait > 0) return { ok: false, lockedMs: wait };
  const stored = await getItem(KEY);
  if (!stored) return { ok: false, lockedMs: 0 };
  if (await matches(stored, pin)) {
    await writeLockout(EMPTY_LOCKOUT);
    if (!stored.startsWith(V2)) await setItem(KEY, await hashPin(pin)); // upgrade an old hash on the first good entry
    return { ok: true };
  }
  const next = recordFailure(state, now);
  await writeLockout(next);
  return { ok: false, lockedMs: lockRemainingMs(next, now) };
}

export async function checkPasscode(pin: string): Promise<boolean> {
  return (await verifyPasscode(pin)).ok;
}

export async function hasPasscode(): Promise<boolean> {
  return Boolean(await getItem(KEY));
}

export async function clearPasscode(): Promise<void> {
  await removeItem(KEY);
  await removeItem(LOCK_KEY);
}
