import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { curlLayout, foldAngle } from '../logic/curl';
import { decorationDrag } from '../logic/pageGesture';
import { releaseCurl } from '../logic/swipe';
import { playCurlCommit } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { useReduceMotion } from '../theme/useReduceMotion';

export type PageFlipHandle = {
  cancel: () => void;
  finish: (direction: 'next' | 'prev', done: () => void, force?: boolean) => void;
};

const CURL_LIGHT = ['rgba(48,28,24,0.55)', 'rgba(90,60,40,0.12)', 'rgba(255,252,246,0.78)', 'rgba(255,248,236,0.2)', 'rgba(70,48,36,0.34)'] as const;

let handoff = false;

function markHandoff() {
  handoff = true;
}

function consumeHandoff() {
  const skip = handoff;
  handoff = false;
  return skip;
}

/** A soft paper curl. The fold stays on the finger, on the UI thread, and the neighbor page is already mounted underneath. */
export const PageFlip = forwardRef<
  PageFlipHandle,
  {
    flipKey: string;
    editing?: boolean;
    canNext?: boolean;
    canPrev?: boolean;
    onScrollLock?: (locked: boolean) => void;
    onCommit?: (direction: 'next' | 'prev') => void;
    nextSheet?: ReactNode;
    prevSheet?: ReactNode;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
  }
>(function PageFlip({ flipKey, editing = false, canNext = true, canPrev = true, onScrollLock, onCommit, nextSheet, prevSheet, style, children }, ref) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const [pageW, setPageW] = useState(0);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const side = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const canNextSV = useSharedValue(canNext ? 1 : 0);
  const canPrevSV = useSharedValue(canPrev ? 1 : 0);
  const editingSV = useSharedValue(editing ? 1 : 0);
  const reduceSV = useSharedValue(false);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const armed = useSharedValue(0);
  const lockRef = useRef(onScrollLock);
  lockRef.current = onScrollLock;
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;

  useEffect(() => {
    canNextSV.value = canNext ? 1 : 0;
    canPrevSV.value = canPrev ? 1 : 0;
    editingSV.value = editing ? 1 : 0;
    reduceSV.value = reduce;
  }, [canNext, canPrev, editing, reduce, canNextSV, canPrevSV, editingSV, reduceSV]);

  function lock(on: boolean) {
    lockRef.current?.(!on);
  }

  function landed(done?: () => void) {
    playCurlCommit();
    side.value = 0;
    done?.();
  }

  function commitSwipe(direction: 'next' | 'prev') {
    playCurlCommit();
    side.value = 0;
    commitRef.current?.(direction);
  }

  const arrived = useRef('');
  useEffect(() => {
    if (consumeHandoff()) {
      side.value = 0;
      arrived.current = flipKey;
      return;
    }
    if (!pageW || arrived.current === flipKey) return;
    arrived.current = flipKey;
    const w = pageW;
    width.value = w;
    if (reduce) {
      side.value = 0;
      playCurlCommit();
      return;
    }
    side.value = -1;
    fingerX.value = 0;
    fingerY.value = (height.value || 400) / 2;
    fingerX.value = withTiming(w, { duration: 420, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) {
        side.value = 0;
        runOnJS(playCurlCommit)();
      }
    });
  }, [flipKey, pageW, fingerX, fingerY, height, reduce, side, width]);

  useImperativeHandle(ref, () => ({
    cancel() {
      const w = width.value || 1;
      const rest = side.value < 0 ? w : 0;
      fingerX.value = withSpring(rest, { damping: 20, stiffness: 280, mass: 0.5 }, (finished) => {
        if (finished) side.value = 0;
      });
    },
    finish(direction, done, force = false) {
      const blocked = direction === 'next' ? canNextSV.value < 1 : canPrevSV.value < 1;
      const w = width.value || pageW || 1;
      if (blocked && !force) {
        side.value = direction === 'next' ? -1 : 1;
        fingerY.value = (height.value || 400) / 2;
        fingerX.value = direction === 'next' ? w * 0.78 : w * 0.22;
        fingerX.value = withTiming(direction === 'next' ? w : 0, { duration: 280, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) side.value = 0;
        });
        return;
      }
      markHandoff();
      side.value = direction === 'next' ? -1 : 1;
      fingerY.value = (height.value || 400) / 2;
      const target = direction === 'next' ? 0 : w;
      const go = () => landed(done);
      if (reduceRef.current) {
        runOnJS(go)();
        return;
      }
      fingerX.value = withTiming(target, { duration: 240, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(go)();
      });
    },
  }), [fingerX, fingerY, side, width, height, canNextSV, canPrevSV, pageW]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Platform.OS !== 'web')
        .activeOffsetX([-16, 16])
        .failOffsetY([-18, 18])
        .onTouchesMove((event, manager) => {
          'worklet';
          if (decorationDrag.value > 0 || editingSV.value > 0 || event.numberOfTouches > 1) manager.fail();
        })
        .onTouchesUp(() => {
          'worklet';
          armed.value = 0;
        })
        .onStart(() => {
          'worklet';
          runOnJS(lock)(true);
        })
        .onUpdate((event) => {
          'worklet';
          const w = width.value || 1;
          const h = height.value || 1;
          const nextward = event.translationX <= 0;
          const blocked = nextward ? canNextSV.value < 1 : canPrevSV.value < 1;
          let x = event.x;
          if (blocked) {
            const pull = Math.max(-w * 0.28, Math.min(w * 0.28, event.translationX * 0.32));
            x = nextward ? w + Math.min(0, pull) : Math.max(0, pull);
          }
          fingerX.value = Math.max(0, Math.min(w, x));
          fingerY.value = Math.max(0, Math.min(h, event.y));
          side.value = nextward ? -1 : 1;
        })
        .onFinalize((event, success) => {
          'worklet';
          runOnJS(lock)(false);
          armed.value = 0;
          if (!success || side.value === 0) return;
          const w = width.value || 1;
          const direction = side.value < 0 ? 'next' : 'prev';
          const reveal = direction === 'next' ? (w - fingerX.value) / w : fingerX.value / w;
          const blocked = direction === 'next' ? canNextSV.value < 1 : canPrevSV.value < 1;
          const decision = releaseCurl(direction, reveal, event.velocityX, blocked);
          if (decision === 'commit') {
            markHandoff();
            const target = direction === 'next' ? 0 : w;
            fingerX.value = withTiming(target, { duration: reduceSV.value ? 120 : 220, easing: Easing.out(Easing.cubic) }, (finished) => {
              if (finished) runOnJS(commitSwipe)(direction);
            });
            return;
          }
          const rest = direction === 'next' ? w : 0;
          fingerX.value = withSpring(rest, { damping: 20, stiffness: 280, mass: 0.5 }, (finished) => {
            if (finished) side.value = 0;
          });
        }),
    [armed, canNextSV, canPrevSV, editingSV, fingerX, fingerY, height, originX, originY, reduceSV, side, width],
  );

  const fadeStyle = useAnimatedStyle(() => {
    if (!reduceSV.value) return { opacity: 1 };
    const w = width.value || 1;
    const reveal = side.value === 0 ? 0 : side.value < 0 ? (w - fingerX.value) / w : fingerX.value / w;
    return { opacity: 1 - Math.min(0.65, reveal) };
  });

  const currentStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    if (reduceSV.value || side.value !== -1) return { width: w, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] };
    const fold = fingerX.value;
    const angle = foldAngle(fingerY.value, h);
    return {
      width: Math.max(0, fold),
      transform: [
        { translateX: fold / 2 },
        { translateY: fingerY.value - h / 2 },
        { rotate: `${angle}deg` },
        { translateX: -fold / 2 },
        { translateY: -(fingerY.value - h / 2) },
      ],
    };
  });

  const uprightStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    if (reduceSV.value || side.value !== -1) return { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] };
    const fold = fingerX.value;
    const angle = foldAngle(fingerY.value, h);
    return {
      transform: [
        { translateX: fold - w / 2 },
        { translateY: fingerY.value - h / 2 },
        { rotate: `${-angle}deg` },
        { translateX: -(fold - w / 2) },
        { translateY: -(fingerY.value - h / 2) },
      ],
    };
  });

  const prevStyle = useAnimatedStyle(() => {
    const h = height.value || 1;
    if (reduceSV.value || side.value !== 1) return { width: 0, opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] };
    const fold = fingerX.value;
    const angle = foldAngle(fingerY.value, h);
    return {
      opacity: 1,
      width: Math.max(0, fold),
      transform: [
        { translateX: fold / 2 },
        { translateY: fingerY.value - h / 2 },
        { rotate: `${angle}deg` },
        { translateX: -fold / 2 },
        { translateY: -(fingerY.value - h / 2) },
      ],
    };
  });

  const curlStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    const which = side.value < 0 ? 'next' : side.value > 0 ? 'prev' : 'flat';
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, which);
    if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
    return {
      opacity: 1,
      left: layout.curlLeft,
      width: layout.curlWidth,
      transform: [
        { translateY: fingerY.value - h / 2 },
        { rotate: `${layout.angle}deg` },
        { translateY: -(fingerY.value - h / 2) },
      ],
    };
  });

  const shadeStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    const which = side.value < 0 ? 'next' : side.value > 0 ? 'prev' : 'flat';
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, which);
    if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
    return {
      opacity: 1,
      left: layout.shadeLeft,
      width: layout.shadeWidth,
      transform: [
        { translateY: fingerY.value - h / 2 },
        { rotate: `${layout.angle}deg` },
        { scaleX: layout.side === 'prev' ? -1 : 1 },
        { translateY: -(fingerY.value - h / 2) },
      ],
    };
  });

  const dropStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    const which = side.value < 0 ? 'next' : side.value > 0 ? 'prev' : 'flat';
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, which);
    if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
    return { opacity: 0.9, left: layout.dropLeft, width: layout.dropWidth };
  });

  const boxRef = useRef<any>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const edgeRef = useRef({ canNext, canPrev });
  edgeRef.current = { canNext, canPrev };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let drag: { x: number; y: number; left: number; top: number; active: boolean } | null = null;
    const inside = (event: PointerEvent) => {
      const node = document.getElementById('diary-page') ?? document.querySelector('[data-testid="diary-page"]');
      const rect = node?.getBoundingClientRect();
      if (!rect) return null;
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null;
      return rect;
    };
    const down = (event: PointerEvent) => {
      if (editingRef.current || decorationDrag.value > 0) return;
      const rect = inside(event);
      if (!rect) return;
      drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, active: false };
    };
    const move = (event: PointerEvent) => {
      if (!drag || decorationDrag.value > 0) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
        if (!(Math.abs(dx) > Math.abs(dy) + 8)) {
          drag = null;
          return;
        }
        drag.active = true;
        lock(true);
        document.body.style.userSelect = 'none';
        window.getSelection()?.removeAllRanges();
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      event.preventDefault();
      const w = width.value || 1;
      const h = height.value || 1;
      const nextward = dx <= 0;
      const blocked = nextward ? !edgeRef.current.canNext : !edgeRef.current.canPrev;
      let fold = event.clientX - drag.left;
      if (blocked) {
        const pull = Math.max(-w * 0.28, Math.min(w * 0.28, dx * 0.32));
        fold = nextward ? w + Math.min(0, pull) : Math.max(0, pull);
      }
      fingerX.value = Math.max(0, Math.min(w, fold));
      fingerY.value = Math.max(0, Math.min(h, event.clientY - drag.top));
      side.value = nextward ? -1 : 1;
    };
    const up = (event: PointerEvent) => {
      const current = drag;
      drag = null;
      document.body.style.userSelect = '';
      if (!current?.active) return;
      lock(false);
      const w = width.value || 1;
      const direction = side.value < 0 ? 'next' : 'prev';
      const reveal = direction === 'next' ? (w - fingerX.value) / w : fingerX.value / w;
      const blocked = direction === 'next' ? !edgeRef.current.canNext : !edgeRef.current.canPrev;
      const velocity = (event.clientX - current.x) * 6;
      if (releaseCurl(direction, reveal, velocity, blocked) === 'commit') {
        markHandoff();
        fingerX.value = withTiming(direction === 'next' ? 0 : w, { duration: 220, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(commitSwipe)(direction);
        });
        return;
      }
      fingerX.value = withSpring(direction === 'next' ? w : 0, { damping: 20, stiffness: 280, mass: 0.5 }, (finished) => {
        if (finished) side.value = 0;
      });
    };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
    };
  }, [fingerX, fingerY, side, width, height]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[{ flexGrow: 1, overflow: 'hidden', borderRadius: theme.radius }, style]}
        ref={boxRef}
        nativeID="diary-page"
        testID="diary-page"
        onLayout={(event) => {
          width.value = event.nativeEvent.layout.width;
          height.value = event.nativeEvent.layout.height;
          setPageW(event.nativeEvent.layout.width);
          if (side.value === 0) fingerX.value = event.nativeEvent.layout.width;
        }}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>{nextSheet}</View>
        <Animated.View style={fadeStyle}>
          <Animated.View style={[{ overflow: 'hidden' }, currentStyle]}>
            <Animated.View style={[{ width: pageW || '100%' }, uprightStyle]}>{children}</Animated.View>
          </Animated.View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.prev, prevStyle]}>
          <View style={{ width: pageW || '100%' }}>{prevSheet}</View>
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
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  prev: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, overflow: 'hidden' },
});
