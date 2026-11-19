import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/BookTheme';
import { useReduceMotion } from '../theme/useReduceMotion';
import type { ThemeMotion } from '../theme/themes';

const DRIFT: Record<Exclude<ThemeMotion, 'none'>, { a: string; b: string; c: string }> = {
  neon: { a: '#FF3DF2', b: '#3DF6FF', c: '#D6FF4A' },
  galaxy: { a: '#F4F1FF', b: '#9AA4FF', c: '#F2C56A' },
  lava: { a: '#FF4F8B', b: '#FFB703', c: '#C77DFF' },
  sparkle: { a: '#FFFFFF', b: '#F2C14E', c: '#FFFFFF' },
  aurora: { a: '#3DDCB0', b: '#7A6CFF', c: '#7EE0FF' },
};

export function ThemeAtmosphere() {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const motion = theme.motion ?? 'none';
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce || motion === 'none') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: motion === 'lava' ? 7000 : 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: motion === 'lava' ? 7000 : 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, motion, reduce]);

  if (reduce || motion === 'none') return null;
  const colors = DRIFT[motion];
  const travel = drift.interpolate({ inputRange: [0, 1], outputRange: [0, motion === 'sparkle' ? 80 : 36] });
  const fall = drift.interpolate({ inputRange: [0, 1], outputRange: [-20, 120] });
  const glow = drift.interpolate({ inputRange: [0, 1], outputRange: [0.18, motion === 'neon' ? 0.55 : 0.4] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.orb, { backgroundColor: colors.a, opacity: glow, transform: [{ translateY: motion === 'sparkle' ? fall : travel }, { translateX: travel }] }]} />
      <Animated.View style={[styles.orb, styles.second, { backgroundColor: colors.b, opacity: glow, transform: [{ translateX: travel }, { translateY: travel }] }]} />
      <Animated.View style={[styles.orb, styles.third, { backgroundColor: colors.c, opacity: 0.35, transform: [{ translateY: fall }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', width: 180, height: 180, borderRadius: 999, top: 40, left: -20 },
  second: { width: 140, height: 220, top: 180, right: -30, left: undefined, borderRadius: 80 },
  third: { width: 16, height: 16, top: 80, left: '60%' },
});
