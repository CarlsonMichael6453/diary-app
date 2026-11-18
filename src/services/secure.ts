import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'diary.passcode.hash';

async function setSecret(value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

async function getSecret() {
  if (Platform.OS === 'web') return AsyncStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

export async function hashPasscode(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `diary-app:${pin}`);
}

export async function savePasscode(pin: string): Promise<void> {
  await setSecret(await hashPasscode(pin));
}

export async function checkPasscode(pin: string): Promise<boolean> {
  const stored = await getSecret();
  if (!stored) return false;
  return stored === (await hashPasscode(pin));
}

export async function hasPasscode(): Promise<boolean> {
  return Boolean(await getSecret());
}

export async function clearPasscode(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
