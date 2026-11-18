import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '../theme/BookTheme';

const TABS = [
  { name: 'index', label: 'Diary' },
  { name: 'calendar', label: 'Calendar' },
  { name: 'search', label: 'Search' },
  { name: 'games', label: 'Games' },
  { name: 'settings', label: 'Settings' },
] as const;

function Icon({ name, color }: { name: string; color: string }) {
  if (name === 'calendar') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Rect x={3} y={5} width={18} height={16} rx={3} stroke={color} strokeWidth={1.8} fill="none" />
        <Path d="M3 10 H21 M8 3 V7 M16 3 V7" stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (name === 'search') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Circle cx={11} cy={11} r={6} stroke={color} strokeWidth={1.8} fill="none" />
        <Path d="M16 16 L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  if (name === 'games') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M12 3 L14.5 9 H21 L16 13 L18 20 L12 16 L6 20 L8 13 L3 9 H9.5 Z" stroke={color} strokeWidth={1.4} fill="none" />
      </Svg>
    );
  }
  if (name === 'settings') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} fill="none" />
        <Path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.5 5.5 L7.6 7.6 M16.4 16.4 L18.5 18.5 M18.5 5.5 L16.4 7.6 M7.6 16.4 L5.5 18.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M5 4 H16 A3 3 0 0 1 19 7 V20 L12 17 L5 20 Z" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
};

export function TabBar({ state, navigateToTab }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { backgroundColor: theme.colors.tab, paddingBottom: Math.max(insets.bottom, 8), borderTopColor: theme.colors.paperEdge }]}>
      {state.routes.map((route, index) => {
        const meta = TABS.find((tab) => tab.name === route.name);
        const focused = state.index === index;
        const color = focused ? theme.colors.accent : theme.colors.inkSoft;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={meta?.label ?? route.name}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.chip }]}>
              <Icon name={route.name} color={color} />
            </View>
            <Text style={{ color, fontFamily: theme.body, fontSize: 11 }}>{meta?.label ?? route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6 },
  item: { flex: 1, alignItems: 'center', gap: 2, minHeight: 52 },
  iconWrap: { width: 36, height: 28, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
