import { Text, View } from 'react-native';

import { getBuddy } from '@/src/buddies/catalog';
import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { todayKey } from '@/src/logic/dates';
import { entryBookId } from '@/src/logic/memories';
import { pickSaying } from '@/src/logic/sayings';
import { writingStreak } from '@/src/logic/streak';
import { WIDGET_BUILD_NOTE, widgetCards } from '@/src/logic/widgets';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

const EMOJI: Record<string, string> = {
  mochi: '🐱', batsy: '🦇', sprout: '🍄', glitter: '🐰', prism: '🦎', inky: '🫧', pip: '🐥', nova: '⭐', shelly: '🪼', ghosty: '👻', ember: '🐉', lumi: '🦄',
};

export default function WidgetPreviewScreen() {
  const theme = useTheme();
  const entries = useDiary((state) => state.entries);
  const settings = useDiary((state) => state.settings);
  const buddy = getBuddy(settings.buddyId);
  const today = todayKey();
  const mine = entries.filter((entry) => entryBookId(entry) === settings.activeBookId);
  const saying = pickSaying(settings.lastSayingId, settings.buddyId);
  const cards = widgetCards({
    buddyName: buddy?.name ?? 'Your pal',
    buddyEmoji: EMOJI[settings.buddyId] ?? '📔',
    streak: writingStreak(mine.map((entry) => entry.date), today),
    wroteToday: mine.some((entry) => entry.date === today),
    saying: saying.text,
  });
  return (
    <Screen>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Widgets</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 8 }}>{WIDGET_BUILD_NOTE}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {cards.map((card) => (
          <View key={card.id} style={{ width: '47%', minHeight: 140, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 12 }}>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>{card.title}</Text>
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22, marginTop: 8 }}>{card.body}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
