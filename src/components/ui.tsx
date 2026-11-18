import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/BookTheme';

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const background = tone === 'primary' ? theme.colors.accent : tone === 'danger' ? theme.colors.danger : 'transparent';
  const color = tone === 'ghost' ? theme.colors.ink : theme.colors.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: tone === 'ghost' ? theme.colors.paperEdge : background, opacity: disabled ? 0.45 : pressed ? 0.8 : 1, borderRadius: theme.radius },
        style,
      ]}
    >
      <Text style={{ color, fontFamily: theme.body, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: selected ? theme.colors.accent : theme.colors.chip,
        borderWidth: color ? 2 : 0,
        borderColor: color ?? 'transparent',
      }}
    >
      <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.colors.chip }]}>
      <Text style={{ fontSize: 14 }}>🪙</Text>
      <Text style={{ color: theme.colors.chipInk, fontFamily: theme.body, fontSize: 14 }}>{coins}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 13, marginBottom: 6 }}>{children}</Text>;
}

export function Confirm({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.overlay}>
      <View style={[styles.dialog, { backgroundColor: theme.colors.card, borderRadius: theme.radius }]}>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>{title}</Text>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 15, marginTop: 8 }}>{body}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Button label="Cancel" tone="ghost" onPress={onCancel} style={{ flex: 1 }} />
          <Button label={confirmLabel} tone={danger ? 'danger' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20,16,20,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 30 },
  dialog: { width: '100%', maxWidth: 420, padding: 18 },
  button: { minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
});
