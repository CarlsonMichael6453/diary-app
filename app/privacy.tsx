import { router, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { useTheme } from '@/src/theme/BookTheme';

export default function PrivacyScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <Button label="Back" tone="ghost" onPress={() => router.back()} />
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Privacy</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
        There is no AI in Diary App, on the website, or in the feedback form. Pages, photos, voice notes, drawings, moods, and tags stay on this device. They are not uploaded.
      </Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
        Send feedback opens an email with the rating and the note you type, plus the app version and the kind of device. It does not include diary entries, titles, moods, photos, or search terms. You can back up the book yourself, or export a PDF, from Settings.
      </Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
        A backup file leaves the device only when you save or share it yourself. You can lock that file with a passphrase. If you turn on encryption at rest, the copy stored on the device is scrambled with a key kept in the secure store. On the website that key lives in local storage, which is less private than a phone’s secure enclave.
      </Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
        Location and weather are off until you turn them on. If you do, only the coordinates go to Open-Meteo so it can name the sky. The words of the page do not go with them.
      </Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
        Widgets and Apple Health or Health Connect run only in a development build. They read what you allow on the device. They do not upload the diary.
      </Text>
      <View style={{ marginTop: 16 }}>
        <Button label="Backups and PDF live in Settings" onPress={() => router.push('/(tabs)/settings' as Href)} />
      </View>
    </Screen>
  );
}
