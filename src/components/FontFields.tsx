import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/BookTheme';
import { FONT_CHOICES, INK_SWATCHES } from '../theme/fonts';
import { Button } from './ui';

export function FontFields({
  fontId,
  inkColor,
  onFont,
  onInk,
  onReset,
  section = 'all',
}: {
  fontId: string | null;
  inkColor: string | null;
  onFont: (id: string | null) => void;
  onInk: (color: string | null) => void;
  onReset?: () => void;
  section?: 'all' | 'type' | 'ink';
}) {
  const theme = useTheme();
  const showType = section !== 'ink';
  const showInk = section !== 'type';
  return (
    <View style={{ gap: 8 }}>
      {showType ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pressable onPress={() => onFont(null)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: fontId ? theme.colors.chip : theme.colors.accent }}>
          <Text style={{ color: fontId ? theme.colors.chipInk : theme.colors.onAccent, fontFamily: theme.body }}>Book style</Text>
        </Pressable>
        {FONT_CHOICES.map((font) => {
          const selected = fontId === font.id;
          return (
            <Pressable key={font.id} onPress={() => onFont(font.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: selected ? theme.colors.accent : theme.colors.chip }}>
              <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: font.script, fontSize: 18 }}>{font.name}</Text>
              <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.inkSoft, fontFamily: theme.body, fontSize: 11 }}>{font.kind}</Text>
            </Pressable>
          );
        })}
      </View> : null}
      {showInk ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Ink color</Text> : null}
      {showInk ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {INK_SWATCHES.map((swatch, index) => (
          <Pressable key={swatch} accessibilityLabel={`Ink swatch ${index + 1}`} onPress={() => onInk(swatch)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: swatch, borderWidth: inkColor === swatch ? 3 : 1, borderColor: inkColor === swatch ? theme.colors.accent : '#FFFFFF' }} />
        ))}
      </View> : null}
      {onReset && showType ? <Button label="Use default font" tone="ghost" onPress={onReset} /> : null}
    </View>
  );
}
