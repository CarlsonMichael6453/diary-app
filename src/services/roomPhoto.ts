import { Platform } from 'react-native';

import { pickDiaryPhoto } from './photos';
import { savePhotoBlob } from './photoStorage';

/** A picture for the room frame. It stays on this device. */
export function pickRoomPhoto(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        void savePhotoBlob(file).then(resolve).catch(() => resolve(null));
      };
      input.click();
    });
  }
  return pickDiaryPhoto().then((result) => ('uri' in result ? result.uri : null));
}
