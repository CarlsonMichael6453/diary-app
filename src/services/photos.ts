import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { savePickedPhoto } from './photoStorage';

const MAX_PHOTOS = 12;

async function persistAsset(asset: ImagePicker.ImagePickerAsset): Promise<string | null> {
  try {
    return await savePickedPhoto({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
  } catch {
    return null;
  }
}

export async function pickDiaryPhoto(): Promise<{ uri: string } | { error: string }> {
  const picked = await pickDiaryPhotos();
  if ('error' in picked) return picked;
  if (!picked.uris[0]) return { error: '' };
  return { uri: picked.uris[0] };
}

export async function pickDiaryPhotos(): Promise<{ uris: string[] } | { error: string }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Photo access is off. You can allow it in system settings and try again.' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.4,
    base64: Platform.OS === 'web',
    allowsMultipleSelection: true,
    selectionLimit: MAX_PHOTOS,
  });
  if (result.canceled || result.assets.length === 0) return { error: '' };
  const saved = await Promise.all(result.assets.slice(0, MAX_PHOTOS).map(persistAsset));
  const uris = saved.filter((uri): uri is string => Boolean(uri));
  if (uris.length === 0) return { error: 'Those photos could not be read.' };
  return { uris };
}

export async function takeDiaryPhoto(): Promise<{ uri: string } | { error: string }> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { error: 'The camera is off. You can allow it in system settings and try again.' };
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.4,
    base64: Platform.OS === 'web',
  });
  if (result.canceled || !result.assets[0]) return { error: '' };
  const uri = await persistAsset(result.assets[0]);
  if (!uri) return { error: 'That photo could not be read.' };
  return { uri };
}
