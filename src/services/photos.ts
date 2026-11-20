import * as ImagePicker from 'expo-image-picker';

const MAX_PHOTOS = 12;

function assetUri(asset: ImagePicker.ImagePickerAsset): string | null {
  if (asset.base64) {
    const mime = asset.mimeType ?? 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri || null;
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
    base64: true,
    allowsMultipleSelection: true,
    selectionLimit: MAX_PHOTOS,
  });
  if (result.canceled || result.assets.length === 0) return { error: '' };
  const uris = result.assets.map(assetUri).filter((uri): uri is string => Boolean(uri)).slice(0, MAX_PHOTOS);
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
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return { error: '' };
  const uri = assetUri(result.assets[0]);
  if (!uri) return { error: 'That photo could not be read.' };
  return { uri };
}
