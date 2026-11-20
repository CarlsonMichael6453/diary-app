import { Text, View } from 'react-native';

import type { PaintedTheme } from '../theme/designs';
import { PatternFill } from './PatternFill';

export function BookCover({ title, theme, width = 250, locked = false, unlatched = false }: { title: string; theme: PaintedTheme; width?: number; locked?: boolean; unlatched?: boolean }) {
  const height = Math.round(width * 1.35);
  return (
    <View
      accessibilityLabel={title}
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
      {theme.design ? <PatternFill design={theme.design} /> : null}
      <View style={{ width: Math.max(16, width * 0.08), backgroundColor: theme.colors.binding }} />
      <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 40 }}>{theme.emoji}</Text>
        <View>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28, lineHeight: 32 }}>{title}</Text>
        </View>
        <View style={{ height: 8, width: '46%', borderRadius: 4, backgroundColor: theme.colors.accent }} />
      </View>
      {locked ? (
        <View
          accessibilityLabel="Diary lock"
          style={{
            position: 'absolute',
            left: width * 0.1,
            right: width * 0.1,
            top: height * 0.62,
            alignItems: 'flex-end',
            transform: [{ translateX: unlatched ? 14 : 0 }, { rotate: unlatched ? '18deg' : '0deg' }],
          }}
        >
          <View style={{ position: 'absolute', left: 0, right: 8, top: 10, height: 8, borderRadius: 4, backgroundColor: theme.colors.binding }} />
          <View style={{ width: 26, alignItems: 'center' }}>
            <View style={{ width: 14, height: 9, borderWidth: 2, borderColor: theme.colors.ink, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginBottom: -1, opacity: unlatched ? 0.7 : 1 }} />
            <View style={{ width: 22, height: 16, borderRadius: 4, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.bg }} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
