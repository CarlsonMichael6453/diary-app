import { Pressable, Text, View } from 'react-native';

import { MOODS, type MoodId } from '../data/moods';
import { playMoodSound } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { HorizontalStrip } from './HorizontalStrip';

export function MoodPicker({ value, onChange }: { value: MoodId; onChange: (mood: MoodId) => void }) {
  const theme = useTheme();
  return (
    <HorizontalStrip contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {MOODS.map((mood) => {
        const selected = mood.id === value;
        return (
          <Pressable
            key={mood.id}
            accessibilityLabel={mood.label}
            onPress={() => {
              if (mood.id !== value) playMoodSound(mood.id);
              onChange(mood.id);
            }}
            style={{
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: selected ? mood.color : theme.colors.chip,
              borderWidth: 2,
              borderColor: selected ? theme.colors.paperInk : 'transparent',
            }}
          >
            <Text style={{ fontSize: 20 }}>{mood.emoji}</Text>
            <Text style={{ color: theme.colors.paperInk, fontFamily: theme.body, fontSize: 11 }}>{mood.label}</Text>
          </Pressable>
        );
      })}
    </HorizontalStrip>
  );
}

export function MoodDot({ mood, size = 14 }: { mood: MoodId; size?: number }) {
  const found = MOODS.find((item) => item.id === mood);
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: found?.color ?? '#ccc' }} />;
}
