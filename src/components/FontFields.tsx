import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/BookTheme';
import { isHexColor } from '../theme/designs';
import { FONT_CHOICES, INK_SWATCHES } from '../theme/fonts';
import { Button } from './ui';

export function FontFields({
  fontId,
  inkColor,
  onFont,
  onInk,
  onReset,
}: {
  fontId: string | null;
  inkColor: string | null;
  onFont: (id: string | null) => void;
  onInk: (color: string | null) => void;
  onReset?: () => void;
}) {
  const theme = useTheme();
  const [custom, setCustom] = useState(inkColor && !INK_SWATCHES.includes(inkColor) ? inkColor : '');
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Ink color</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {INK_SWATCHES.map((hex) => (
          <Pressable key={hex} accessibilityLabel={`Ink ${hex}`} onPress={() => onInk(hex)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: hex, borderWidth: inkColor === hex ? 3 : 1, borderColor: inkColor === hex ? theme.colors.accent : '#FFFFFF' }} />
        ))}
      </View>
      <TextInput
        value={custom}
        onChangeText={setCustom}
        autoCapitalize="none"
        placeholder="#1A1420"
        placeholderTextColor={theme.colors.inkSoft}
        accessibilityLabel="Custom ink color"
        style={{ backgroundColor: theme.colors.card, color: theme.colors.ink, borderRadius: 12, padding: 10, fontFamily: theme.body, maxWidth: 180 }}
      />
      <Button
        label="Use custom color"
        tone="ghost"
        onPress={() => {
          if (isHexColor(custom.trim())) onInk(custom.trim());
        }}
      />
      {onReset ? <Button label="Use default font" tone="ghost" onPress={onReset} /> : null}
    </View>
  );
}
