import { Text, View } from 'react-native';

import type { Theme } from '../theme/themes';

export function BookCover({ title, theme, width = 250 }: { title: string; theme: Theme; width?: number }) {
  const height = Math.round(width * 1.35);
  return (
    <View
      accessibilityLabel={`${theme.name} book cover`}
      style={{
        width,
        height,
        borderRadius: 10,
        backgroundColor: theme.colors.bg,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.paperEdge,
      }}
    >
      <View style={{ width: Math.max(16, width * 0.08), backgroundColor: theme.colors.binding }} />
      <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 40 }}>{theme.emoji}</Text>
        <View>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28, lineHeight: 32 }}>{title}</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 6 }}>{theme.name}</Text>
        </View>
        <View style={{ height: 8, width: '46%', borderRadius: 4, backgroundColor: theme.colors.accent }} />
      </View>
    </View>
  );
}
