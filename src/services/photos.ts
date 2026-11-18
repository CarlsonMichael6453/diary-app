import * as ImagePicker from 'expo-image-picker';

export async function pickDiaryPhoto(): Promise<{ uri: string } | { error: string }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Photo access is off. You can allow it in system settings and try again.' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.4,
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return { error: '' };
  const asset = result.assets[0];
  if (asset.base64) {
    const mime = asset.mimeType ?? 'image/jpeg';
    return { uri: `data:${mime};base64,${asset.base64}` };
  }
  if (asset.uri) return { uri: asset.uri };
  return { error: 'That photo could not be read.' };
}
