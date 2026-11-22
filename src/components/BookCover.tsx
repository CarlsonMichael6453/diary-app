import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import type { PaintedTheme } from '../theme/designs';
import { useReduceMotion } from '../theme/useReduceMotion';
import { PatternFill } from './PatternFill';

export function BookCover({
  title,
  theme,
  width = 250,
  locked = false,
  unlatched = false,
  onUnlock,
}: {
  title: string;
  theme: PaintedTheme;
  width?: number;
  locked?: boolean;
  unlatched?: boolean;
  onUnlock?: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const lift = useRef(new Animated.Value(unlatched ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      lift.setValue(unlatched ? 1 : 0);
      return;
    }
    Animated.spring(lift, { toValue: unlatched ? 1 : 0, friction: 6, tension: 120, useNativeDriver: false }).start();
  }, [lift, reduceMotion, unlatched]);
  const height = Math.round(width * 1.35);
  const shackle = {
    transform: [
      { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-32deg'] }) },
    ],
  };
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unlatched ? 'Open clasp' : 'Unlock the diary'}
          onPress={onUnlock}
          style={{ position: 'absolute', right: width * 0.06, top: height * 0.42, width: 54, alignItems: 'center' }}
        >
          <View style={{ position: 'absolute', left: -width * 0.28, right: 10, top: 16, height: 10, borderRadius: 5, backgroundColor: theme.colors.binding }} />
          <Animated.View style={[{ alignItems: 'center' }, shackle]}>
            <View style={{ width: 18, height: 12, borderWidth: 2.5, borderColor: theme.colors.ink, borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: -1, backgroundColor: unlatched ? 'transparent' : theme.colors.bg }} />
          </Animated.View>
          <View style={{ width: 28, height: 22, borderRadius: 6, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.ink }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.bg }} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
