import { type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isDarkHex } from '../theme/themes';
import { useTheme } from '../theme/BookTheme';

export function Screen({
  children,
  scroll = true,
  style,
  padded = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const theme = useTheme();
  const body = (
    <View style={[styles.column, padded && styles.padded, style]}>
      {children}
    </View>
  );
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <StatusBar style={isDarkHex(theme.colors.bg) ? 'light' : 'dark'} />
      <View style={[styles.blob, { backgroundColor: theme.colors.accent, opacity: 0.18, top: -40, right: -30 }]} />
      <View style={[styles.blob, { backgroundColor: theme.colors.accent2, opacity: 0.16, bottom: 80, left: -50, width: 180, height: 180 }]} />
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 28 },
  column: { width: '100%', maxWidth: 920, alignSelf: 'center', flexGrow: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 8 },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 999 },
});
