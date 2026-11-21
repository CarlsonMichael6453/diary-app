import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { decorationDrag, drawingLock, stripTouch } from '../logic/pageGesture';
import { claimHorizontalSwipe, releaseCurl, verticalScrollWins } from '../logic/swipe';
import { playCurlCommit } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { useReduceMotion } from '../theme/useReduceMotion';

export type PageFlipHandle = {
  cancel: () => void;
  finish: (direction: 'next' | 'prev', done: () => void, force?: boolean) => void;
};

let handoff = false;

function markHandoff() {
  handoff = true;
}

function consumeHandoff() {
  const skip = handoff;
  handoff = false;
  return skip;
}

type CurlCorner = 'tr' | 'br' | 'tl' | 'bl';

function curlGeometry(w: number, h: number, progress: number, corner: CurlCorner, incoming: boolean) {
  const t = Math.max(0, Math.min(1, progress));
  const cx = corner[1] === 'r' ? w : 0;
  const cy = corner[0] === 'b' ? h : 0;
  const ix = corner[1] === 'r' ? -1 : 1;
  const iy = corner[0] === 't' ? 1 : -1;
  const pullDeg = 66 * Math.pow(1 - t, 0.42) + 2;
  const pull = (pullDeg * Math.PI) / 180;
  const dx = ix * Math.cos(pull);
  const dy = iy * Math.sin(pull);
  const project = (x: number, y: number) => (x - cx) * dx + (y - cy) * dy;
  const maxProj = Math.max(project(0, 0), project(w, 0), project(0, h), project(w, h));
  const dist = Math.pow(t, 1.15) * (maxProj * 0.96 + 24);
  const mx = cx + dx * dist;
  const my = cy + dy * dist;
  const side = (x: number, y: number) => (x - mx) * dx + (y - my) * dy;
  const hits: number[][] = [];
  const add = (x: number, y: number) => {
    if (x < -2 || x > w + 2 || y < -2 || y > h + 2) return;
    const point = [Math.min(w, Math.max(0, x)), Math.min(h, Math.max(0, y))];
    if (!hits.some((other) => Math.hypot(other[0] - point[0], other[1] - point[1]) < 2)) hits.push(point);
  };
  if (Math.abs(dx) > 1e-4) {
    add(mx + (my * dy) / dx, 0);
    add(mx - ((h - my) * dy) / dx, h);
  }
  if (Math.abs(dy) > 1e-4) {
    add(0, my + (mx * dx) / dy);
    add(w, my - ((w - mx) * dx) / dy);
  }
  const sort = (pts: number[][]) => {
    if (pts.length < 3) return pts;
    const ax = pts.reduce((sum, pt) => sum + pt[0], 0) / pts.length;
    const ay = pts.reduce((sum, pt) => sum + pt[1], 0) / pts.length;
    return pts.slice().sort((a, b) => Math.atan2(a[1] - ay, a[0] - ax) - Math.atan2(b[1] - ay, b[0] - ax));
  };
  const corners = [[0, 0], [w, 0], [w, h], [0, h]];
  const front = sort([...corners.filter(([x, y]) => (incoming ? side(x, y) <= 0.8 : side(x, y) >= -0.8)), ...hits]);
  const radius = 7 + 14 * Math.sin(Math.PI * Math.pow(t, 0.8));
  const flapDepth = Math.min(Math.max(0, dist) * 0.74, 26 + Math.min(w, h) * 0.33 * Math.sin(Math.PI * Math.min(t, 0.96)));
  const flap = hits.length >= 2
    ? (() => {
        const midX = (hits[0][0] + hits[1][0]) / 2;
        const midY = (hits[0][1] + hits[1][1]) / 2;
        const span = Math.hypot(midX - cx, midY - cy) || 1;
        const alongX = (midX - cx) / span;
        const alongY = (midY - cy) / span;
        const reach = incoming ? Math.min(flapDepth, span * 0.85) : Math.min(span * 0.78, flapDepth);
        const apexX = incoming ? midX + alongX * reach : cx + alongX * reach;
        const apexY = incoming ? midY + alongY * reach : cy + alongY * reach;
        return [hits[0], hits[1], [Math.min(w, Math.max(0, apexX)), Math.min(h, Math.max(0, apexY))]];
      })()
    : [];
  return { front, flap, hits, dx, dy, radius, dist };
}

function curlPolygon(pts: number[][]) {
  if (pts.length < 3) return 'polygon(0px 0px, 0px 0px, 0px 0px)';
  return `polygon(${pts.map((pt) => `${pt[0].toFixed(1)}px ${pt[1].toFixed(1)}px`).join(',')})`;
}

/** A corner curl that plays itself out. The neighbor page is already mounted underneath. */
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
  const paperRef = useRef(theme.colors.paper);
  paperRef.current = theme.colors.paper;
  const playRef = useRef<(direction: 'next' | 'prev', top: boolean) => void>(() => {});
  const curlRef = useRef<(direction: 'next' | 'prev', top: boolean, onDone: () => void) => void>(() => {});
  const stopCurlRef = useRef<() => void>(() => {});

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

  function playTurnFromJS(direction: 'next' | 'prev', top: boolean) {
    if (Platform.OS === 'web') {
      playRef.current(direction, top);
      return;
    }
    const blocked = direction === 'next' ? canNextSV.value < 1 : canPrevSV.value < 1;
    if (blocked || drawingLock.value > 0) return;
    side.value = direction === 'next' ? -1 : 1;
    fingerY.value = top ? 1 : 0;
    fingerX.value = direction === 'next' ? 0 : 1;
    markHandoff();
    const go = () => {
      side.value = 0;
      fingerX.value = 0;
      commitSwipe(direction);
    };
    fingerX.value = withTiming(direction === 'next' ? 1 : 0, { duration: 560, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(go)();
    });
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
    fingerX.value = 0;
    playCurlCommit();
  }, [flipKey, pageW, fingerX, side, width]);

  useImperativeHandle(ref, () => ({
    cancel() {
      side.value = 0;
      fingerX.value = 0;
      stopCurlRef.current();
    },
    finish(direction, done, force = false) {
      const blocked = direction === 'next' ? canNextSV.value < 1 : canPrevSV.value < 1;
      if (blocked && !force) return;
      markHandoff();
      const go = () => landed(done);
      if (Platform.OS === 'web') {
        curlRef.current(direction, true, go);
        return;
      }
      side.value = direction === 'next' ? -1 : 1;
      fingerY.value = 1;
      fingerX.value = direction === 'next' ? 0 : 1;
      if (reduceRef.current) {
        runOnJS(go)();
        return;
      }
      fingerX.value = withTiming(direction === 'next' ? 1 : 0, { duration: 560, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(go)();
      });
    },
  }), [fingerX, fingerY, side, height, canNextSV, canPrevSV]);

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
        .onFinalize((event) => {
          'worklet';
          runOnJS(lock)(false);
          armed.value = 0;
          if (drawingLock.value > 0) return;
          const w = width.value || 1;
          const h = height.value || 1;
          const direction = event.translationX <= 0 ? 'next' : 'prev';
          const reveal = Math.abs(event.translationX) / w;
          const blocked = direction === 'next' ? canNextSV.value < 1 : canPrevSV.value < 1;
          if (releaseCurl(direction, reveal, event.velocityX, blocked) !== 'commit') return;
          runOnJS(playTurnFromJS)(direction, event.y < h / 2);
        }),
    [armed, canNextSV, canPrevSV, editingSV, fingerX, fingerY, height, originX, originY, reduceSV, side, width],
  );

  const fadeStyle = useAnimatedStyle(() => {
    if (!reduceSV.value || side.value === 0) return { opacity: 1 };
    return { opacity: 1 - Math.min(1, fingerX.value) };
  });

  const currentStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    if (reduceSV.value || side.value !== -1) return { opacity: 1, transform: [], willChange: 'transform' } as object;
    const progress = fingerX.value;
    const top = fingerY.value > 0.5;
    const angleY = -progress * 150;
    const angleZ = (top ? -1 : 1) * progress * 18;
    const originY = top ? -h / 2 : h / 2;
    return {
      opacity: 1,
      transform: [
        { perspective: 1100 },
        { translateX: w / 2 },
        { translateY: originY },
        { rotateZ: `${angleZ}deg` },
        { rotateY: `${angleY}deg` },
        { translateX: -w / 2 },
        { translateY: -originY },
      ],
      willChange: 'transform',
    } as object;
  });

  const prevStyle = useAnimatedStyle(() => {
    const w = width.value || 1;
    const h = height.value || 1;
    if (side.value !== 1) return { opacity: 0, transform: [{ translateX: -8 }], willChange: 'transform' } as object;
    const progress = fingerX.value;
    const top = fingerY.value > 0.5;
    const angleY = progress * 150;
    const angleZ = (top ? 1 : -1) * progress * 18;
    const originY = top ? -h / 2 : h / 2;
    return {
      opacity: 1,
      transform: [
        { perspective: 1100 },
        { translateX: -w / 2 },
        { translateY: originY },
        { rotateZ: `${angleZ}deg` },
        { rotateY: `${angleY}deg` },
        { translateX: w / 2 },
        { translateY: -originY },
      ],
      willChange: 'transform',
    } as object;
  });

  const shadowStyle = useAnimatedStyle(() => {
    if (reduceSV.value || side.value === 0) return { opacity: 0 };
    const reveal = side.value < 0 ? fingerX.value : 1 - fingerX.value;
    return { opacity: 0.22 + reveal * 0.25 };
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
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerType === 'touch') return;
      follow(event.clientX, event.clientY, event.timeStamp);
    };
    const byId = (id: string) => pageNode()?.querySelector(`#${id}`) as HTMLElement | null;
    const clearCurl = () => {
      for (const id of ['curl-leaf', 'curl-prev', 'curl-flap', 'curl-shadow', 'curl-crease', 'curl-roll']) {
        const el = byId(id);
        if (!el) continue;
        el.style.clipPath = '';
        el.style.setProperty('-webkit-clip-path', '');
        if (id !== 'curl-leaf') {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.style.transform = '';
        }
      }
    };
    const paintCurl = (direction: 'next' | 'prev', top: boolean, amount: number) => {
      const root = pageNode() as HTMLElement | null;
      if (!root) return;
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      const incoming = direction === 'prev';
      const corner: CurlCorner = direction === 'next' ? (top ? 'tr' : 'br') : top ? 'tl' : 'bl';
      const shape = curlGeometry(w, h, amount, corner, incoming);
      const leaf = byId('curl-leaf');
      const prev = byId('curl-prev');
      const flap = byId('curl-flap');
      const shadow = byId('curl-shadow');
      const crease = byId('curl-crease');
      const roll = byId('curl-roll');
      const page = incoming ? prev : leaf;
      const clipOf = (el: HTMLElement, value: string) => {
        el.style.clipPath = value;
        el.style.setProperty('-webkit-clip-path', value);
      };
      if (leaf && incoming) clipOf(leaf, '');
      if (prev) {
        prev.style.visibility = incoming ? 'visible' : 'hidden';
        prev.style.opacity = incoming ? '1' : '0';
      }
      if (page) clipOf(page, amount <= 0.015 ? '' : curlPolygon(shape.front));
      const revealX = incoming ? shape.dx : -shape.dx;
      const revealY = incoming ? shape.dy : -shape.dy;
      const showFlap = flap && shape.flap.length >= 3 && amount > 0.03 && amount < 0.97;
      if (showFlap && flap) {
        const clip = curlPolygon(shape.flap);
        flap.style.visibility = 'visible';
        flap.style.opacity = '1';
        flap.style.backgroundColor = '#e4c7a6';
        flap.style.backgroundImage = 'linear-gradient(155deg, rgba(255,246,232,0.55), rgba(166,112,68,0.38))';
        clipOf(flap, clip);
      } else if (flap) {
        flap.style.opacity = '0';
        flap.style.visibility = 'hidden';
      }
      if (shadow) {
        if (showFlap) {
          clipOf(shadow, curlPolygon(shape.flap));
          shadow.style.backgroundColor = 'rgba(42,26,18,0.28)';
          shadow.style.backgroundImage = 'none';
          shadow.style.filter = 'blur(8px)';
          shadow.style.visibility = 'visible';
          shadow.style.opacity = '1';
          shadow.style.transform = `translate(${revealX * 18}px, ${revealY * 18}px)`;
        } else {
          shadow.style.opacity = '0';
        }
      }
      if (shape.hits.length < 2 || amount <= 0.03 || amount >= 0.97) {
        for (const el of [crease, roll]) {
          if (el) el.style.opacity = '0';
        }
        return;
      }
      const [a, b] = shape.hits;
      const fx = b[0] - a[0];
      const fy = b[1] - a[1];
      const length = Math.max(8, Math.hypot(fx, fy));
      let ang = (Math.atan2(fy, fx) * 180) / Math.PI;
      if (fy * revealX - fx * revealY < 0) ang += 180;
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;
      const place = (el: HTMLElement | null, cssH: number, shift: number, scaleY: number) => {
        if (!el) return;
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.width = `${length}px`;
        el.style.transformOrigin = 'center center';
        const destX = midX + revealX * shift;
        const destY = midY + revealY * shift;
        el.style.transform = `translate(${destX - length / 2}px, ${destY - cssH / 2}px) rotate(${ang}deg) scaleY(${scaleY})`;
      };
      if (roll) {
        roll.style.backgroundImage = 'linear-gradient(to bottom, rgba(60,40,30,0.05) 0%, rgba(255,252,246,0.15) 16%, #fffaf2 38%, #f3ddc4 52%, #c48962 68%, #6a4030 86%, #3a241c 100%)';
      }
      place(roll, 36, shape.radius * 0.15, Math.max(0.4, (shape.radius * 2) / 36));
      if (crease) {
        crease.style.backgroundImage = 'linear-gradient(to bottom, rgba(42,26,20,0), rgba(42,26,20,0.24))';
      }
      place(crease, 16, -(shape.radius * 0.45 + 3), 1);
    };
    let curlFrame = 0;
    const runCurl = (direction: 'next' | 'prev', top: boolean, onDone: () => void) => {
      if (settling || drawingLock.value > 0) return;
      const blocked = direction === 'next' ? !edgeRef.current.canNext : !edgeRef.current.canPrev;
      if (blocked) return;
      settling = true;
      lock(true);
      markHandoff();
      let finishedOnce = false;
      const complete = () => {
        if (finishedOnce) return;
        finishedOnce = true;
        if (curlFrame) cancelAnimationFrame(curlFrame);
        settling = false;
        clearCurl();
        lock(false);
        onDone();
      };
      let timer = 0;
      stopCurlRef.current = () => {
        if (curlFrame) cancelAnimationFrame(curlFrame);
        window.clearTimeout(timer);
        settling = false;
        clearCurl();
        lock(false);
      };
      if (reduceRef.current) {
        complete();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 560);
        const eased = 1 - (1 - t) ** 3;
        paintCurl(direction, top, eased);
        if (t < 1) curlFrame = requestAnimationFrame(tick);
        else complete();
      };
      curlFrame = requestAnimationFrame(tick);
      timer = window.setTimeout(complete, 780);
    };
    const play = (direction: 'next' | 'prev', top: boolean) => runCurl(direction, top, () => commitSwipe(direction));
    playRef.current = play;
    curlRef.current = runCurl;
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
        const topTap = event.clientY - current.top < (height.value || 1) / 2;
        if (!interactive && tap) {
          if (localX > w * 0.82 && edgeRef.current.canNext) play( 'next', topTap);
          else if (localX < w * 0.18 && edgeRef.current.canPrev) play('prev', topTap);
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
      if (releaseCurl(direction, reveal, velocity, blocked) === 'commit') play(direction, current.y - current.top < (height.value || 1) / 2);
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
        style={[{ flexGrow: 1, overflow: 'hidden', borderRadius: theme.radius, perspective: 1200 } as object, style]}
        ref={boxRef}
        nativeID="diary-page"
        testID="diary-page"
        onLayout={(event) => {
          width.value = event.nativeEvent.layout.width;
          height.value = event.nativeEvent.layout.height;
          setPageW(event.nativeEvent.layout.width);
          if (side.value === 0) fingerX.value = 0;
        }}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>{nextSheet}</View>
        {Platform.OS === 'web' ? (
          <>
            <View nativeID="curl-shadow" pointerEvents="none" style={styles.shadow} />
            <View nativeID="curl-leaf" style={styles.leaf}>{children}</View>
            <View nativeID="curl-crease" pointerEvents="none" style={styles.crease} />
            <View nativeID="curl-prev" pointerEvents="none" style={styles.cover}>{prevSheet}</View>
            <View nativeID="curl-flap" pointerEvents="none" style={styles.flap} />
            <View nativeID="curl-roll" pointerEvents="none" style={styles.roll} />
          </>
        ) : (
          <>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, shadowStyle, { backgroundColor: 'rgba(28,16,20,0.18)' }]} />
            <Animated.View style={[styles.leaf, fadeStyle, currentStyle]}>
              <View style={styles.face}>{children}</View>
              <View pointerEvents="none" style={[styles.back, { backgroundColor: theme.colors.paper }]} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.cover, prevStyle]}>
              <View style={styles.face}>{prevSheet}</View>
              <View pointerEvents="none" style={[styles.back, { backgroundColor: theme.colors.paper }]} />
            </Animated.View>
          </>
        )}
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  leaf: { flexGrow: 1, zIndex: 2, backgroundColor: 'transparent' },
  cover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 4, opacity: 0 },
  shadow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 3, opacity: 0 },
  crease: { position: 'absolute', left: 0, top: 0, width: 8, height: 16, zIndex: 3, opacity: 0 },
  flap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 5, opacity: 0 },
  roll: { position: 'absolute', left: 0, top: 0, width: 8, height: 36, zIndex: 6, opacity: 0 },
  face: { flexGrow: 1, backfaceVisibility: 'hidden' },
  back: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    transform: [{ rotateY: '180deg' }],
    borderWidth: 1,
    borderColor: 'rgba(70,48,36,0.18)',
  },
});
