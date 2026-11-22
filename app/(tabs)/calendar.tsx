import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { VoiceMark } from '@/src/components/VoiceChip';
import { Button } from '@/src/components/ui';
import { getMood } from '@/src/data/moods';
import { formatPretty, monthLabel, todayKey } from '@/src/logic/dates';
import type { DiaryEntry } from '@/src/models/types';
import { BrowseFilter, NoMatch } from '@/src/components/BrowseFilter';
import { useBrowseFilter } from '@/src/logic/browseFilter';
import { entryMatches, filterIsActive } from '@/src/logic/entryFilter';
import { mergeTagCatalog } from '@/src/logic/tags';
import { entryBookId } from '@/src/logic/memories';
import { playPageTurn } from '@/src/services/sounds';
import { entriesOn, useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const theme = useTheme();
  const allEntries = useDiary((state) => state.entries);
  const activeBookId = useDiary((state) => state.settings.activeBookId);
  const entries = allEntries.filter((entry) => entryBookId(entry) === activeBookId);
  const filter = useBrowseFilter();
  const filtering = filterIsActive(filter);
  const tagChoices = mergeTagCatalog([], entries);
  const today = todayKey();
  const initial = new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const selectedEntries = selected ? entriesOn(entries, selected).filter((entry) => entryMatches(entry, filter)) : [];

  function shift(delta: number) {
    playPageTurn();
    const date = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
    setSelected(null);
  }

  return (
    <Screen>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36 }}>Calendar</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>Days with pages take on that day’s mood color.</Text>
      <View style={{ marginBottom: 12 }}>
        <BrowseFilter tags={tagChoices} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Pressable onPress={() => shift(-1)} accessibilityLabel="Previous month"><Text style={{ color: theme.colors.accent, fontSize: 22, fontFamily: theme.body }}>‹</Text></Pressable>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>{monthLabel(cursor.year, cursor.month)}</Text>
        <Pressable onPress={() => shift(1)} accessibilityLabel="Next month"><Text style={{ color: theme.colors.accent, fontSize: 22, fontFamily: theme.body }}>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((label, index) => (
          <Text key={`${label}${index}`} style={{ flex: 1, textAlign: 'center', color: theme.colors.inkSoft, fontFamily: theme.body }}>{label}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        {cells.map((day, index) => {
          if (!day) return <View key={`e${index}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEntries = byDate.get(key) ?? [];
          const matching = dayEntries.filter((entry) => entryMatches(entry, filter));
          const dimmed = filtering && dayEntries.length > 0 && matching.length === 0;
          const mood = matching[0] ? getMood(matching[0].mood) : null;
          const isToday = key === today;
          const isSelected = key === selected;
          return (
            <Pressable key={key} onPress={() => setSelected(key)} style={{ width: '14.28%', aspectRatio: 1, padding: 3, opacity: dimmed ? 0.35 : 1 }}>
              <View
                style={{
                  flex: 1,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mood ? `${mood.color}55` : 'transparent',
                  borderWidth: isToday || isSelected ? 2 : 0,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.ink,
                }}
              >
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{day}</Text>
                {dayEntries.length > 1 ? <Text style={{ color: theme.colors.inkSoft, fontSize: 10 }}>{dayEntries.length}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={{ marginTop: 16, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 10 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>{formatPretty(selected)}</Text>
          {selectedEntries.length === 0 ? (
            filtering && (byDate.get(selected) ?? []).length > 0 ? <NoMatch /> : (
            <>
              <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>This day is blank.</Text>
              <Button label="Write this day" onPress={() => router.push(`/entry/new?date=${selected}` as Href)} />
            </>
            )
          ) : (
            selectedEntries.map((entry) => (
              <Pressable key={entry.id} onPress={() => router.push(`/entry/${entry.id}` as Href)}>
                <Text style={{ color: theme.colors.ink, fontFamily: theme.script, fontSize: 22 }}>{getMood(entry.mood).emoji} {entry.title || 'Untitled page'}{entry.voiceNote ? ' ' : ''}{entry.voiceNote ? <VoiceMark /> : null}</Text>
                <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }} numberOfLines={2}>{entry.body}</Text>
              </Pressable>
            ))
          )}
          {selectedEntries.length > 0 ? <Button label="Add another page" tone="ghost" onPress={() => router.push(`/entry/new?date=${selected}` as Href)} /> : null}
        </View>
      ) : (
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 16 }}>Tap a day to open its pages.</Text>
      )}
    </Screen>
  );
}
