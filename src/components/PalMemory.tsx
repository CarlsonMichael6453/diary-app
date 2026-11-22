import { router, type Href } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { palMayRemember, palRecall } from '../logic/palMemory';
import { entryBookId } from '../logic/memories';
import { todayKey } from '../logic/dates';
import { useDiary } from '../store/useDiary';
import { useTheme } from '../theme/BookTheme';

export function PalMemory() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const entries = useDiary((state) => state.entries);
  const palOn = settings.buddyId !== 'none' && settings.palNotifications !== false;
  if (!palMayRemember({ palOn, deepWriting: settings.deepWriting })) return null;
  const today = todayKey();
  const book = entries.filter((entry) => entryBookId(entry) === settings.activeBookId);
  const recall = palRecall(book, today);
  if (!recall) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recall.line}
      onPress={() => router.push(`/entry/${recall.entryId}` as Href)}
      style={{ backgroundColor: theme.colors.paper, borderColor: theme.colors.paperEdge, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 280 }}
    >
      <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 16, lineHeight: 20 }}>{recall.line}</Text>
    </Pressable>
  );
}
