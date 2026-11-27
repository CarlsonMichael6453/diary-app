import { Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { getMood } from '@/src/data/moods';
import { todayKey } from '@/src/logic/dates';
import { entryBookId } from '@/src/logic/memories';
import { HEALTH_BUILD_NOTE, healthMoodNotes } from '@/src/logic/health';
import { goodDayNotes, moodCounts, yearPixels } from '@/src/logic/stats';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

export default function StatsScreen() {
  const theme = useTheme();
  const entries = useDiary((state) => state.entries);
  const settings = useDiary((state) => state.settings);
  const year = Number(todayKey().slice(0, 4));
  const mine = entries.filter((entry) => entryBookId(entry) === settings.activeBookId);
  const pixels = yearPixels(mine, year);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const counts = moodCounts(mine, from, to);
  const notes = goodDayNotes(mine);
  const health = settings.healthCorrelation ? healthMoodNotes(mine.map((entry) => ({ date: entry.date, mood: entry.mood }))) : [];

  return (
    <Screen>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Mood stats</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Year in pixels for {settings.books.find((book) => book.id === settings.activeBookId)?.title ?? 'this book'}. Nothing leaves the device.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 16 }}>
        {pixels.map((cell) => (
          <View key={cell.date} style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: cell.mood ? getMood(cell.mood as 'calm').color : theme.colors.chip }} />
        ))}
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>This year</Text>
      {counts.length === 0 ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>No moods yet this year.</Text> : counts.map((row) => {
        const mood = getMood(row.mood as 'calm');
        const width = Math.max(8, row.count * 28);
        return (
          <View key={row.mood} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Text style={{ width: 90, color: theme.colors.ink, fontFamily: theme.body }}>{mood.emoji} {mood.label}</Text>
            <View style={{ width, height: 14, borderRadius: 7, backgroundColor: mood.color }} />
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{row.count}</Text>
          </View>
        );
      })}
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>On good days</Text>
      {notes.length === 0 ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Add tags or activities on a few happy pages and a pattern can show up here.</Text> : notes.map((note) => <Text key={note} style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 6 }}>{note}</Text>)}
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Health</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{HEALTH_BUILD_NOTE}</Text>
      {health.map((note) => <Text key={note} style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 6 }}>{note}</Text>)}
    </Screen>
  );
}
