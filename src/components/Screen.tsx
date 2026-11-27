import { router, usePathname } from 'expo-router';
import { type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeAtmosphere } from './ThemeAtmosphere';
import { PatternFill } from './PatternFill';
import { isDarkHex } from '../theme/themes';
import { useTheme } from '../theme/BookTheme';

export function Screen({
  children,
  scroll = true,
  style,
  padded = true,
  nav = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  nav?: boolean;
}) {
  const theme = useTheme();
  const body = (
    <View style={[styles.column, padded && styles.padded, style]}>
      {nav ? <NavRow /> : null}
      {children}
    </View>
  );
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <StatusBar style={isDarkHex(theme.colors.bg) ? 'light' : 'dark'} />
      {theme.design ? <PatternFill design={theme.design} /> : null}
      {theme.design ? null : <View style={[styles.blob, { backgroundColor: theme.colors.accent, opacity: 0.18, top: -40, right: -30 }]} />}
      {theme.design ? null : <View style={[styles.blob, { backgroundColor: theme.colors.accent2, opacity: 0.16, bottom: 80, left: -50, width: 180, height: 180 }]} />}
      <ThemeAtmosphere />
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

function NavRow() {
  const theme = useTheme();
  const path = usePathname();
  const home = path === '/' || path === '/index';
  return (
    <View style={styles.nav}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else if (!home) router.replace('/');
        }}
      >
        <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>‹ Back</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Home" onPress={() => router.navigate('/')}>
        <Text style={{ color: home ? theme.colors.chipInk : theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  root: { flex: 1 },
  scroll: { paddingBottom: 28 },
  column: { width: '100%', maxWidth: 920, alignSelf: 'center', flexGrow: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 8 },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 999 },
});
