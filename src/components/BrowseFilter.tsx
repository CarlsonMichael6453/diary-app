import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MOODS } from '../data/moods';
import { clearBrowseFilter, toggleFilterMood, toggleFilterTag, useBrowseFilter } from '../logic/browseFilter';
import { filterIsActive } from '../logic/entryFilter';
import { useTheme } from '../theme/BookTheme';
import { ChoiceMenu } from './ChoiceMenu';

export function BrowseFilter({ tags }: { tags: string[] }) {
  const theme = useTheme();
  const filter = useBrowseFilter();
  const [open, setOpen] = useState<'mood' | 'tag' | null>(null);
  const active = filterIsActive(filter);
  const moodLabel = filter.moods.length === 0
    ? 'Mood'
    : filter.moods.length === 1
      ? MOODS.find((mood) => mood.id === filter.moods[0])?.label ?? 'Mood'
      : `${filter.moods.length} moods`;
  const tagLabel = filter.tags.length === 0 ? 'Tags' : filter.tags.length === 1 ? filter.tags[0] : `${filter.tags[0]} +${filter.tags.length - 1}`;

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <ChoiceMenu
        pinPage={false}
        label="Filter by mood"
        open={open === 'mood'}
        onToggle={() => setOpen((value) => (value === 'mood' ? null : 'mood'))}
        summary={<Text numberOfLines={1} style={{ color: theme.colors.ink, fontFamily: theme.body }}>{moodLabel}</Text>}
      >
        {MOODS.map((mood) => {
          const on = filter.moods.includes(mood.id);
          return (
            <Pressable
              key={mood.id}
              accessibilityRole="checkbox"
              accessibilityLabel={mood.label}
              accessibilityState={{ checked: on }}
              onPress={() => toggleFilterMood(mood.id)}
              style={{ paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', gap: 8, backgroundColor: on ? mood.color : 'transparent' }}
            >
              <Text style={{ fontSize: 18 }}>{mood.emoji}</Text>
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{on ? '✓ ' : ''}{mood.label}</Text>
            </Pressable>
          );
        })}
      </ChoiceMenu>
      <ChoiceMenu
        pinPage={false}
        label="Filter by tag"
        open={open === 'tag'}
        onToggle={() => setOpen((value) => (value === 'tag' ? null : 'tag'))}
        summary={<Text numberOfLines={1} style={{ color: theme.colors.ink, fontFamily: theme.body }}>{tagLabel}</Text>}
      >
        {tags.length === 0 ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, padding: 10 }}>No tags yet</Text> : null}
        {tags.map((tag) => {
          const on = filter.tags.some((item) => item.toLowerCase() === tag.toLowerCase());
          return (
            <Pressable
              key={tag}
              accessibilityRole="checkbox"
              accessibilityLabel={`Tag ${tag}`}
              accessibilityState={{ checked: on }}
              onPress={() => toggleFilterTag(tag)}
              style={{ paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start', margin: 6, borderRadius: 999, backgroundColor: on ? theme.colors.accent : theme.colors.chip }}
            >
              <Text style={{ color: on ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{on ? '✓ ' : ''}{tag}</Text>
            </Pressable>
          );
        })}
      </ChoiceMenu>
      {active ? (
        <Pressable accessibilityLabel="Clear filters" onPress={clearBrowseFilter} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: theme.colors.accent, fontFamily: theme.body }}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function NoMatch() {
  const theme = useTheme();
  return <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>No pages match</Text>;
}
