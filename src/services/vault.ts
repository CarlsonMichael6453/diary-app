import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bytesToHex, decryptString, encryptString, hexToBytes, randomKey } from '../logic/crypto';

const KEY = 'diary.vault.key';
let encryptWrites = false;

export function setVaultEncryption(enabled: boolean) {
  encryptWrites = enabled;
}

async function readKey(): Promise<Uint8Array> {
  const existing = Platform.OS === 'web' ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  if (existing) return hexToBytes(existing);
  // randomKey() throws when the platform has no secure random source. Better to fail than to use a guessable key.
  const created = bytesToHex(randomKey());
  if (Platform.OS === 'web') await AsyncStorage.setItem(KEY, created);
  else await SecureStore.setItemAsync(KEY, created);
  return hexToBytes(created);
}

export const vaultStorage = {
  async getItem(name: string): Promise<string | null> {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;
    if (!raw.startsWith('enc1:')) return raw;
    const key = await readKey();
    return decryptString(raw.slice(5), key);
  },
  async setItem(name: string, value: string): Promise<void> {
    if (!encryptWrites) {
      await AsyncStorage.setItem(name, value);
      return;
    }
    const key = await readKey();
    await AsyncStorage.setItem(name, `enc1:${encryptString(value, key)}`);
  },
  async removeItem(name: string): Promise<void> {
    await AsyncStorage.removeItem(name);
  },
};
