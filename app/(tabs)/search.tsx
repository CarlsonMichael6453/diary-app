import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Highlight } from '@/src/components/Highlight';
import { Screen } from '@/src/components/Screen';
import { getMood } from '@/src/data/moods';
import { formatPretty } from '@/src/logic/dates';
import { snippetAround } from '@/src/logic/search';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

export default function SearchScreen() {
  const theme = useTheme();
  const entries = useDiary((state) => state.entries);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return [];
    return entries
      .filter((entry) => `${entry.title}\n${entry.body}`.toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, needle]);

  return (
    <Screen>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36 }}>Search</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="A word, a name, a feeling"
        placeholderTextColor={theme.colors.inkSoft}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          marginTop: 12,
          backgroundColor: theme.colors.card,
          color: theme.colors.ink,
          fontFamily: theme.body,
          fontSize: 16,
          borderRadius: theme.radius,
          borderWidth: 1.5,
          borderColor: theme.colors.accent,
          paddingHorizontal: 14,
          minHeight: 48,
        }}
      />
      {!needle ? (
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 18 }}>Type any word and every page that contains it will show up, with the match marked.</Text>
      ) : results.length === 0 ? (
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 18 }}>No pages mention that yet.</Text>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{results.length} {results.length === 1 ? 'page' : 'pages'}</Text>
          {results.map((entry) => {
            const mood = getMood(entry.mood);
            const hay = `${entry.title} ${entry.body}`;
            return (
              <Pressable key={entry.id} onPress={() => router.push(`/entry/${entry.id}` as Href)} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, borderLeftWidth: 6, borderLeftColor: mood.color }}>
                <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>{formatPretty(entry.date)} · {mood.emoji}</Text>
                <Highlight text={entry.title || 'Untitled page'} query={query} style={{ color: theme.colors.ink, fontFamily: theme.script, fontSize: 24 }} />
                <Highlight text={snippetAround(hay, query)} query={query} style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 4 }} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
