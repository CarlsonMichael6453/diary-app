import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const BITS = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + (index % 2) * 0.2;
  const dist = 64 + (index % 5) * 22;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.72 - 8,
    color: ['#E2B23A', '#E36B8A', '#6C8CFF', '#3FAE6A', '#5C3A45'][index % 5],
    delay: (index % 6) * 28,
    size: index % 3 === 0 ? 14 : 10,
    round: index % 2 === 0,
  };
});

function Bit({ x, y, color, delay, size, round }: (typeof BITS)[number]) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.62 ? 1 : 1 - (t.value - 0.62) / 0.38,
    transform: [{ translateX: x * t.value }, { translateY: y * t.value - t.value * 18 }, { scale: 0.4 + (1 - t.value) * 0.8 }],
  }));
  return <Animated.View style={[styles.bit, style, { width: size, height: size, borderRadius: round ? size : 1, backgroundColor: color }]} />;
}

/** A short original sparkle for the Diary Plus success moment. */
export function SparkleBurst() {
  return (
    <View pointerEvents="none" style={styles.burst}>
      {BITS.map((bit, index) => (
        <Bit key={index} {...bit} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', left: 0, right: 0, top: 0, height: 8, alignItems: 'center', zIndex: 4 },
  bit: { position: 'absolute', left: '50%', top: 10 },
});
