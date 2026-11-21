import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { curlLayout, foldAngle } from '../logic/curl';
import { decorationDrag, drawingLock, stripTouch } from '../logic/pageGesture';
import { claimHorizontalSwipe, releaseCurl, verticalScrollWins } from '../logic/swipe';
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
    commitRef.current?.(direction);
  }

  const nativeFinish = useRef<(() => void) | null>(null);
  function armNativeTurn(commit: boolean, direction: 'next' | 'prev') {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      side.value = 0;
      fingerX.value = width.value || 1;
      if (commit) commitSwipe(direction);
    };
    nativeFinish.current = finish;
    setTimeout(finish, commit ? 780 : 560);
  }
  function finishNativeTurn() {
    nativeFinish.current?.();
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
    side.value = 0;
    fingerX.value = w;
    playCurlCommit();
  }, [flipKey, pageW, fingerX, side, width]);

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
        .activeOffsetX([-12, 12])
        .failOffsetY([-18, 18])
        .onTouchesMove((event, manager) => {
          'worklet';
          if (decorationDrag.value > 0 || stripTouch.value > 0 || drawingLock.value > 0 || editingSV.value > 0 || event.numberOfTouches > 1) manager.fail();
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
        .onFinalize((event) => {
          'worklet';
          runOnJS(lock)(false);
          armed.value = 0;
          if (side.value === 0) return;
          const w = width.value || 1;
          const direction = side.value < 0 ? 'next' : 'prev';
          const reveal = direction === 'next' ? (w - fingerX.value) / w : fingerX.value / w;
          const blocked = direction === 'next' ? canNextSV.value < 1 : canPrevSV.value < 1;
          const decision = releaseCurl(direction, reveal, event.velocityX, blocked);
          const target = decision === 'commit' ? (direction === 'next' ? 0 : w) : direction === 'next' ? w : 0;
          if (decision === 'commit') markHandoff();
          runOnJS(armNativeTurn)(decision === 'commit', direction);
          fingerX.value = withSpring(target, { velocity: event.velocityX, damping: 22, stiffness: 190, mass: 0.7, overshootClamping: true }, (finished) => {
            if (finished) runOnJS(finishNativeTurn)();
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
    if (reduceSV.value || side.value !== -1) return { width: w, clipPath: 'none' };
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, 'next');
    if (Platform.OS !== 'web') return { width: Math.max(0, layout.foldX) };
    const slope = Math.tan((layout.angle * Math.PI) / 180);
    const x0 = layout.foldX + (0 - fingerY.value) * slope;
    const x1 = layout.foldX + (h - fingerY.value) * slope;
    return {
      width: w,
      clipPath: `polygon(0px 0px, ${x0}px 0px, ${x1}px ${h}px, 0px ${h}px)`,
      willChange: 'clip-path, transform',
    } as object;
  });

  const prevStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    if (reduceSV.value || side.value !== 1) return { width: 0, opacity: 0, clipPath: 'none' };
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, 'prev');
    if (Platform.OS !== 'web') return { opacity: 1, width: Math.max(0, layout.foldX) };
    const slope = Math.tan((layout.angle * Math.PI) / 180);
    const x0 = layout.foldX + (0 - fingerY.value) * slope;
    const x1 = layout.foldX + (h - fingerY.value) * slope;
    return {
      opacity: 1,
      width: w,
      clipPath: `polygon(0px 0px, ${x0}px 0px, ${x1}px ${h}px, 0px ${h}px)`,
      willChange: 'clip-path, transform',
    } as object;
  });

  const foldStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    const which = side.value < 0 ? 'next' : side.value > 0 ? 'prev' : 'flat';
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, which);
    if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
    return {
      opacity: 1,
      width: 16,
      transform: [
        { translateX: layout.foldX - 8 },
        { translateY: fingerY.value - h / 2 },
        { rotate: `${layout.angle}deg` },
        { translateY: -(fingerY.value - h / 2) },
      ],
      willChange: 'transform',
    } as object;
  });

  const shadowStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    const which = side.value < 0 ? 'next' : side.value > 0 ? 'prev' : 'flat';
    const layout = curlLayout(fingerX.value, fingerY.value, w, h, which);
    if (reduceSV.value || layout.side === 'flat') return { opacity: 0, width: 0 };
    return {
      opacity: 0.9,
      width: 28,
      transform: [
        { translateX: layout.foldX + 6 },
        { translateY: fingerY.value - h / 2 },
        { rotate: `${layout.angle}deg` },
        { translateY: -(fingerY.value - h / 2) },
      ],
      willChange: 'transform',
    } as object;
  });

  const boxRef = useRef<any>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const edgeRef = useRef({ canNext, canPrev });
  edgeRef.current = { canNext, canPrev };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let drag: { x: number; y: number; left: number; top: number; active: boolean; vx: number; lastX: number; lastT: number; startT: number; field: HTMLElement | null } | null = null;
    let settling = false;
    const elementFrom = (event: Event) => {
      const node = event.target as Node | null;
      return (node instanceof Element ? node : node?.parentElement) as HTMLElement | null;
    };
    const pageNode = () => {
      const nodes = [...document.querySelectorAll('#diary-page, [data-testid="diary-page"]')];
      return nodes.reverse().find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 40 && rect.height > 40 && rect.bottom > 0 && rect.top < window.innerHeight;
      }) ?? null;
    };
    const begin = (clientX: number, clientY: number, timeStamp: number, targetNode: EventTarget | null, prevent: () => void) => {
      if (drag && Math.abs(drag.x - clientX) < 8 && Math.abs(drag.y - clientY) < 8 && timeStamp - drag.startT < 40) return;
      if (settling || editingRef.current || decorationDrag.value > 0 || stripTouch.value > 0 || drawingLock.value > 0) return;
      const target = (targetNode instanceof Element ? targetNode : (targetNode as Node | null)?.parentElement) as HTMLElement | null;
      if (target?.closest?.('[data-no-page-turn], [data-decoration]')) return;
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      const rect = pageNode()?.getBoundingClientRect();
      if (!rect || clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
      const field = target?.closest?.('input, textarea') as HTMLElement | null;
      if (field) prevent();
      drag = { x: clientX, y: clientY, left: rect.left, top: rect.top, active: false, vx: 0, lastX: clientX, lastT: timeStamp, startT: timeStamp, field };
    };
    const follow = (clientX: number, clientY: number, timeStamp: number) => {
      if (!drag || decorationDrag.value > 0 || stripTouch.value > 0) return;
      const dx = clientX - drag.x;
      const dy = clientY - drag.y;
      if (!drag.active) {
        if (claimHorizontalSwipe(dx, dy, false)) {
          drag.active = true;
          drag.field = null;
          lock(true);
          document.body.style.userSelect = 'none';
          window.getSelection()?.removeAllRanges();
          const active = document.activeElement as HTMLElement | null;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur();
        } else if (verticalScrollWins(dx, dy)) {
          drag = null;
          return;
        } else return;
      }
      if (!drag) return;
      const dt = timeStamp - drag.lastT;
      if (dt >= 12) {
        const sample = ((clientX - drag.lastX) / dt) * 1000;
        if (Math.abs(sample) > Math.abs(drag.vx)) drag.vx = sample;
      }
      drag.lastX = clientX;
      drag.lastT = timeStamp;
      const w = width.value || 1;
      const h = height.value || 1;
      const nextward = dx <= 0;
      const blocked = nextward ? !edgeRef.current.canNext : !edgeRef.current.canPrev;
      let fold = clientX - drag.left;
      if (blocked) {
        const pull = Math.max(-w * 0.28, Math.min(w * 0.28, dx * 0.32));
        fold = nextward ? w + Math.min(0, pull) : Math.max(0, pull);
      }
      fingerX.value = Math.max(0, Math.min(w, fold));
      fingerY.value = Math.max(0, Math.min(h, clientY - drag.top));
      side.value = nextward ? -1 : 1;
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerType === 'touch') return;
      follow(event.clientX, event.clientY, event.timeStamp);
    };
    const settle = (commit: boolean, direction: 'next' | 'prev', releaseVelocity = 0) => {
      if (settling) return;
      settling = true;
      const w = width.value || 1;
      const target = commit ? (direction === 'next' ? 0 : w) : direction === 'next' ? w : 0;
      let finishedOnce = false;
      const complete = () => {
        if (finishedOnce) return;
        finishedOnce = true;
        settling = false;
        side.value = 0;
        fingerX.value = w;
        if (commit) commitSwipe(direction);
      };
      if (commit) markHandoff();
      fingerX.value = withSpring(target, { velocity: releaseVelocity, damping: commit ? 22 : 26, stiffness: commit ? 180 : 240, mass: 0.75, overshootClamping: true }, () => {
        runOnJS(complete)();
      });
      window.setTimeout(complete, commit ? 720 : 520);
    };
    const up = (event: PointerEvent) => {
      const current = drag;
      drag = null;
      document.body.style.userSelect = '';
      if (!current || settling) return;
      const w = width.value || 1;
      if (!current.active) {
        const localX = event.clientX - current.left;
        const target = elementFrom(event);
        const interactive = target?.closest?.('button, a, input, textarea, [data-no-page-turn], [data-decoration]');
        const tap = Math.abs(event.clientX - current.x) < 14 && Math.abs(event.clientY - current.y) < 14;
        if (tap && current.field) current.field.focus();
        if (!interactive && tap) {
          if (localX > w * 0.82 && edgeRef.current.canNext) settle(true, 'next');
          else if (localX < w * 0.18 && edgeRef.current.canPrev) settle(true, 'prev');
        }
        return;
      }
      lock(false);
      const liftedX = Math.abs(event.clientX - current.lastX) <= 36 ? event.clientX : current.lastX;
      const net = liftedX - current.x;
      const elapsed = Math.max(16, current.lastT - current.startT);
      const average = (net / elapsed) * 1000;
      const velocity = Math.sign(current.vx) === Math.sign(net) && Math.abs(current.vx) > Math.abs(average) ? current.vx : average;
      const direction = net <= 0 ? 'next' : 'prev';
      const reveal = Math.abs(net) / w;
      const blocked = direction === 'next' ? !edgeRef.current.canNext : !edgeRef.current.canPrev;
      side.value = direction === 'next' ? -1 : 1;
      settle(releaseCurl(direction, reveal, velocity, blocked) === 'commit', direction, velocity);
    };
    const fromTouch = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      up(new PointerEvent('pointerup', { clientX: touch?.clientX ?? drag?.lastX ?? 0, clientY: touch?.clientY ?? drag?.y ?? 0, bubbles: true }));
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      begin(event.clientX, event.clientY, event.timeStamp, event.target, () => event.preventDefault());
    };
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      begin(touch.clientX, touch.clientY, event.timeStamp, event.target, () => undefined);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      follow(touch.clientX, touch.clientY, event.timeStamp);
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', move, { capture: true, passive: true });
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    window.addEventListener('touchend', fromTouch, true);
    window.addEventListener('touchcancel', fromTouch, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('touchend', fromTouch, true);
      window.removeEventListener('touchcancel', fromTouch, true);
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
            <View style={{ width: pageW || '100%', minHeight: '100%', flexGrow: 1 }}>{children}</View>
          </Animated.View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.prev, prevStyle]}>
          <View style={{ width: pageW || '100%' }}>{prevSheet}</View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.band, shadowStyle]}>
          <LinearGradient colors={['rgba(28,16,20,0.28)', 'rgba(28,16,20,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.band, foldStyle, { backgroundColor: theme.colors.paper }]}>
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
