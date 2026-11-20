import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { curlLayout } from '../logic/curl';
import { playPageTurn } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { useReduceMotion } from '../theme/useReduceMotion';

export type PageFlipHandle = {
  follow: (progress: number) => void;
  cancel: () => void;
  finish: (direction: 'next' | 'prev', done: () => void) => void;
};

const CURL_LIGHT = ['rgba(48,28,24,0.55)', 'rgba(90,60,40,0.12)', 'rgba(255,252,246,0.72)', 'rgba(255,248,236,0.18)', 'rgba(70,48,36,0.32)'] as const;

/** A soft paper curl. A finger can drive it; reduced motion fades. The page-turn sound plays when a turn lands. */
export const PageFlip = forwardRef<PageFlipHandle, { flipKey: string; style?: StyleProp<ViewStyle>; children: ReactNode }>(
  function PageFlip({ flipKey, style, children }, ref) {
    const theme = useTheme();
    const reduce = useReduceMotion();
    const progress = useSharedValue(0);
    const width = useSharedValue(0);
    const reduceSV = useSharedValue(false);
    const skipArrival = useRef(false);
    const reduceRef = useRef(reduce);
    reduceRef.current = reduce;

    useEffect(() => {
      reduceSV.value = reduce;
    }, [reduce, reduceSV]);

    useEffect(() => {
      if (skipArrival.current) {
        skipArrival.current = false;
        progress.value = 0;
        return;
      }
      progress.value = reduce ? 0 : -1;
      progress.value = withTiming(0, { duration: reduce ? 160 : 420, easing: Easing.out(Easing.cubic) });
    }, [flipKey, progress, reduce]);

    useImperativeHandle(ref, () => ({
      follow(value: number) {
        progress.value = Math.max(-1, Math.min(1, value));
      },
      cancel() {
        progress.value = reduceRef.current
          ? withTiming(0, { duration: 140, easing: Easing.out(Easing.cubic) })
          : withSpring(0, { damping: 16, stiffness: 180, mass: 0.7 });
      },
      finish(direction, done) {
        skipArrival.current = true;
        const land = () => {
          progress.value = 0;
          playPageTurn();
          done();
        };
        progress.value = withTiming(direction === 'next' ? -1 : 1, { duration: reduceRef.current ? 140 : 260, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(land)();
        });
      },
    }), [progress]);

    const fadeStyle = useAnimatedStyle(() => ({
      opacity: reduceSV.value ? 1 - Math.min(0.6, Math.abs(progress.value) * 0.6) : 1,
    }));

    const coverStyle = useAnimatedStyle(() => {
      const layout = curlLayout(progress.value, width.value);
      if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
      return { opacity: 1, left: layout.coverLeft, width: layout.coverWidth };
    });

    const curlStyle = useAnimatedStyle(() => {
      const layout = curlLayout(progress.value, width.value);
      if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
      return {
        opacity: 1,
        left: layout.curlLeft,
        width: layout.curlWidth,
        borderTopRightRadius: layout.side === 'next' ? layout.curlWidth / 2 : 2,
        borderBottomRightRadius: layout.side === 'next' ? layout.curlWidth / 2 : 2,
        borderTopLeftRadius: layout.side === 'prev' ? layout.curlWidth / 2 : 2,
        borderBottomLeftRadius: layout.side === 'prev' ? layout.curlWidth / 2 : 2,
      };
    });

    const shadeStyle = useAnimatedStyle(() => {
      const layout = curlLayout(progress.value, width.value);
      if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
      return { opacity: 1, left: layout.shadeLeft, width: layout.shadeWidth, transform: [{ scaleX: layout.side === 'prev' ? -1 : 1 }] };
    });

    const dropStyle = useAnimatedStyle(() => {
      const layout = curlLayout(progress.value, width.value);
      if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
      return { opacity: 0.9, left: layout.dropLeft, width: layout.dropWidth };
    });

    return (
      <View style={[{ flexGrow: 1, overflow: 'hidden', borderRadius: theme.radius }, style]} onLayout={(event) => { width.value = event.nativeEvent.layout.width; }}>
        <Animated.View style={fadeStyle}>{children}</Animated.View>
        <Animated.View pointerEvents="none" style={[styles.sheet, coverStyle, { backgroundColor: theme.colors.paper }]}>
          <View style={[styles.sheetShade, { backgroundColor: theme.colors.paperEdge }]} />
          {Array.from({ length: 14 }, (_, index) => (
            <View key={index} style={[styles.rule, { top: 36 + index * 28, backgroundColor: theme.colors.line }]} />
          ))}
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.band, shadeStyle]}>
          <LinearGradient colors={['rgba(40,24,28,0)', 'rgba(40,24,28,0.28)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.band, dropStyle]}>
          <LinearGradient colors={['rgba(28,16,20,0.34)', 'rgba(28,16,20,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.band, curlStyle, { backgroundColor: theme.colors.paper }]}>
          <LinearGradient colors={CURL_LIGHT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  sheet: { position: 'absolute', top: 0, bottom: 0, overflow: 'hidden' },
  sheetShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.28 },
  rule: { position: 'absolute', left: 18, right: 14, height: 1 },
  band: { position: 'absolute', top: 0, bottom: 0, overflow: 'hidden' },
});
