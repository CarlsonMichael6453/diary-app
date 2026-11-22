import { Platform } from 'react-native';

import { pickDiaryPhoto } from './photos';

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
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
  return pickDiaryPhoto().then((result) => ('uri' in result ? result.uri : null));
}
