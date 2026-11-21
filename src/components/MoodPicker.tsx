import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getMood, MOODS, type MoodId } from '../data/moods';
import { playMoodSound } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { ChoiceMenu } from './ChoiceMenu';

export function MoodPicker({ value, onChange }: { value: MoodId; onChange: (mood: MoodId) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = getMood(value);
  return (
    <ChoiceMenu
      label={current ? `Mood ${current.label}` : 'Mood'}
      open={open}
      onToggle={() => setOpen((shown) => !shown)}
      summary={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>{current?.emoji ?? '·'}</Text>
          <Text numberOfLines={1} style={{ color: theme.colors.paperInk, fontFamily: theme.body, flex: 1 }}>{current?.label ?? 'Mood'}</Text>
        </View>
      }
    >
      {MOODS.map((mood) => {
        const selected = mood.id === value;
        return (
          <Pressable
            key={mood.id}
            accessibilityLabel={mood.label}
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
    </ChoiceMenu>
  );
}

export function MoodDot({ mood, size = 14 }: { mood: MoodId; size?: number }) {
  const found = MOODS.find((item) => item.id === mood);
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: found?.color ?? '#ccc' }} />;
}
