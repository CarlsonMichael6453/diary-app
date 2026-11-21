import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getMood, MOODS, type MoodId } from '../data/moods';
import { playMoodSound } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { holdPage } from '../logic/pageGesture';

export function MoodPicker({ value, onChange }: { value: MoodId; onChange: (mood: MoodId) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = getMood(value);
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityLabel={current ? `Mood ${current.label}` : 'Mood'}
        onPressIn={() => holdPage(true)}
        onPressOut={() => holdPage(false)}
        onPress={() => setOpen((shown) => !shown)}
        style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.paperEdge, backgroundColor: theme.colors.card, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 20 }}>{current?.emoji ?? '·'}</Text>
        <Text numberOfLines={1} style={{ color: theme.colors.paperInk, fontFamily: theme.body, flex: 1 }}>{current?.label ?? 'Mood'}</Text>
      </Pressable>
      {open ? (
        <View style={{ marginTop: 6, maxHeight: 220, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.paperEdge, overflow: 'scroll' }}>
          {MOODS.map((mood) => {
            const selected = mood.id === value;
            return (
              <Pressable
                key={mood.id}
                accessibilityLabel={mood.label}
                onPressIn={() => holdPage(true)}
                onPressOut={() => holdPage(false)}
                onPress={() => {
                  if (mood.id !== value) playMoodSound(mood.id);
                  onChange(mood.id);
                  setOpen(false);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: selected ? mood.color : 'transparent' }}
              >
                <Text style={{ fontSize: 18 }}>{mood.emoji}</Text>
                <Text style={{ color: theme.colors.paperInk, fontFamily: theme.body }}>{mood.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function MoodDot({ mood, size = 14 }: { mood: MoodId; size?: number }) {
  const found = MOODS.find((item) => item.id === mood);
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: found?.color ?? '#ccc' }} />;
}
