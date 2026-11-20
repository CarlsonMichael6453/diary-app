import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { playPageTurn } from '../services/sounds';
import { useReduceMotion } from '../theme/useReduceMotion';

/** A short book-page flip. Reduced motion fades instead of rotating. */
export function PageFlip({ flipKey, style, children }: { flipKey: string; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reduce = useReduceMotion();
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    turn.setValue(0);
    void playPageTurn();
    Animated.timing(turn, {
      toValue: 1,
      duration: reduce ? 160 : 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [flipKey, reduce, turn]);

  const rotateY = turn.interpolate({ inputRange: [0, 1], outputRange: reduce ? ['0deg', '0deg'] : ['-70deg', '0deg'] });
  const opacity = turn.interpolate({ inputRange: [0, 0.35, 1], outputRange: [reduce ? 0 : 0.15, 0.85, 1] });
  const shadow = turn.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={[{ flexGrow: 1 }, style]}>
      <Animated.View
        style={[
          styles.page,
          {
            opacity,
            transform: [{ perspective: 1400 }, { rotateY }],
          },
        ]}
      >
        {children}
        {reduce ? null : <Animated.View pointerEvents="none" style={[styles.shade, { opacity: shadow }]} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backfaceVisibility: 'hidden' },
  shade: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', backgroundColor: '#1A1420' },
});
