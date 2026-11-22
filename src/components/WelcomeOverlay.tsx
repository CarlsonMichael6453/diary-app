import { router, usePathname, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { useDiary } from '../store/useDiary';
import { useTheme } from '../theme/BookTheme';
import { Button } from './ui';

export function WelcomeOverlay() {
  const theme = useTheme();
  const path = usePathname();
  const seen = useDiary((state) => state.settings.seenWelcome);
  const patchSettings = useDiary((state) => state.patchSettings);
  if (seen || path.includes('pal-fit')) return null;

  function finish(href?: Href) {
    patchSettings({ seenWelcome: true });
    if (href) router.push(href);
  }

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 60, backgroundColor: theme.colors.bg, justifyContent: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12 }}>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36 }}>Your diary stays here</Text>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 17, lineHeight: 26 }}>
          There is no AI in this app or on the website. Nothing reads your pages, and nothing you write is uploaded.
        </Text>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 16, lineHeight: 24 }}>
          Pages, photos, voice notes, and drawings stay on this device. You can back them up yourself, or print and export a PDF, from Settings. Send feedback only emails the rating and note you type. It never includes diary entries.
        </Text>
        <Button label="Keep it on this device" onPress={() => finish()} />
        <Button label="How to back up or export a PDF" tone="ghost" onPress={() => finish('/privacy' as Href)} />
      </View>
    </View>
  );
}
