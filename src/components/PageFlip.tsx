import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { playPageTurn } from '../services/sounds';
import { useReduceMotion } from '../theme/useReduceMotion';

export type PageFlipHandle = {
  follow: (progress: number) => void;
  cancel: () => void;
  finish: (direction: 'next' | 'prev', done: () => void) => void;
};

/** A book-page flip. A finger can drive it; reduced motion fades. */
export const PageFlip = forwardRef<PageFlipHandle, { flipKey: string; style?: StyleProp<ViewStyle>; children: ReactNode }>(
  function PageFlip({ flipKey, style, children }, ref) {
    const reduce = useReduceMotion();
    const pose = useRef(new Animated.Value(0)).current;
    const skipArrival = useRef(false);
    const reduceRef = useRef(reduce);
    reduceRef.current = reduce;

    useEffect(() => {
      pose.stopAnimation();
      if (skipArrival.current) {
        skipArrival.current = false;
        pose.setValue(0);
        return;
      }
      pose.setValue(reduce ? 0 : -1);
      void playPageTurn();
      Animated.timing(pose, {
        toValue: 0,
        duration: reduce ? 160 : 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [flipKey, pose, reduce]);

    useImperativeHandle(ref, () => ({
      follow(progress: number) {
        pose.stopAnimation();
        pose.setValue(Math.max(-1, Math.min(1, progress)));
      },
      cancel() {
        Animated.spring(pose, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 0 }).start();
      },
      finish(direction, done) {
        skipArrival.current = true;
        void playPageTurn();
        Animated.timing(pose, {
          toValue: direction === 'next' ? -1 : 1,
          duration: reduceRef.current ? 120 : 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) done();
        });
      },
    }), [pose]);

    const rotateY = pose.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: reduce ? ['0deg', '0deg', '0deg'] : ['-78deg', '0deg', '78deg'],
    });
    const opacity = pose.interpolate({
      inputRange: [-1, -0.2, 0, 0.2, 1],
      outputRange: reduce ? [0.35, 1, 1, 1, 0.35] : [0.45, 1, 1, 1, 0.45],
    });
    const shadow = pose.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0.5, 0, 0.5],
    });

    return (
      <View style={[{ flexGrow: 1 }, style]}>
        <Animated.View style={[styles.page, { opacity, transform: [{ perspective: 1400 }, { rotateY }] }]}>
          {children}
          {reduce ? null : <Animated.View pointerEvents="none" style={[styles.shade, { opacity: shadow }]} />}
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  page: { flexGrow: 1, backfaceVisibility: 'hidden' },
  shade: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '42%', backgroundColor: '#1A1420' },
});
