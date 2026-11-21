import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/BookTheme';

/** A page action. The name shows on a long press, and on hover in the browser. */
export function IconButton({
  label,
  onPress,
  children,
  style,
  small,
  onPressIn,
  onPressOut,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
}) {
  const theme = useTheme();
  const [tip, setTip] = useState(false);
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'flex-end' }, style]}>
      {tip ? (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 48, backgroundColor: theme.colors.ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, zIndex: 5, maxWidth: 180 }}>
          <Text style={{ color: theme.colors.bg, fontFamily: theme.body, fontSize: 12 }}>{label}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={onPressIn}
        onLongPress={() => setTip(true)}
        onHoverIn={() => setTip(true)}
        onHoverOut={() => setTip(false)}
        onPressOut={() => {
          onPressOut?.();
          setTimeout(() => setTip(false), 700);
        }}
        style={{ width: small ? 32 : 46, height: small ? 32 : 44, borderRadius: small ? 10 : 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.paperEdge, backgroundColor: theme.colors.card }}
      >
        {children}
      </Pressable>
    </View>
  );
}

export function DeviceLock({ saved }: { saved: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable accessibilityLabel={saved ? 'On this device' : 'Not saved yet'} onPress={() => setOpen((value) => !value)} hitSlop={8}>
        <LockIcon color={theme.colors.inkSoft} />
      </Pressable>
      {open ? (
        <View style={{ position: 'absolute', top: 26, left: -70, width: 210, zIndex: 40, backgroundColor: theme.colors.ink, borderRadius: 10, padding: 8 }}>
          <Text style={{ color: theme.colors.bg, fontFamily: theme.body, fontSize: 12 }}>Your diary is stored privately on this device.</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ShuffleIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path d="M2 4 H6 L10 12 H14 M14 4 H10 L6 12 H2" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M12 2 L14 4 L12 6 M12 10 L14 12 L12 14" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12">
      <Path d="M2 2 L10 10 M10 2 L2 10" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function PromptIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M3 3 H11 V9 H7 L4 12 V9 H3 Z" stroke={color} strokeWidth={1.3} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path d="M5 8 V6 a4 4 0 0 1 8 0 V8" stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M4 8 H14 V15 H4 Z" stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

export function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 3 a2.5 2.5 0 0 1 2.5 2.5 V10 a2.5 2.5 0 0 1 -5 0 V5.5 A2.5 2.5 0 0 1 10 3 Z" fill={color} />
      <Path d="M5 9.5 a5 5 0 0 0 10 0 M10 14.5 V17" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function StyleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M4 5 H16 V15 H4 Z" stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M4 9 H16 M8 5 V15" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

export function PalIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M10 3 a6 6 0 0 1 6 6 c0 4 -3 8 -6 8 s-6 -4 -6 -8 a6 6 0 0 1 6 -6 Z" stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M8 9.5 h.5 M11.5 9.5 h.5 M8 12.5 c1 1 3 1 4 0" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
