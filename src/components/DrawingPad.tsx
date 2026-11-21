import { useEffect, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';

import { DRAW_COLORS, PEN_SIZES, padStrokes, pageStrokes, pencilCursorCss, strokesFrom, type Stroke } from '../logic/drawing';
import { isHexColor } from '../theme/designs';
import { HorizontalStrip } from './HorizontalStrip';

function hslHex(hue: number): string {
  const saturation = 0.7;
  const lightness = 0.52;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hp = hue / 60;
  const x = chroma * (1 - Math.abs((hp % 2) - 1));
  const channel = hp < 1 ? [chroma, x, 0] : hp < 2 ? [x, chroma, 0] : hp < 3 ? [0, chroma, x] : hp < 4 ? [0, x, chroma] : hp < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const match = lightness - chroma / 2;
  const hex = (value: number) => Math.round((value + match) * 255).toString(16).padStart(2, '0');
  return `#${hex(channel[0])}${hex(channel[1])}${hex(channel[2])}`;
}

export function PencilIcon({ color, size = 32 }: { color: string; size?: number }) {
  const fill = isHexColor(color) ? color : '#3A2A32';
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M8 20 L20 8 L24 12 L12 24 Z" fill={fill} stroke="#2A211C" strokeWidth={1} />
      <Path d="M20 8 L23 5 L27 9 L24 12 Z" fill="#F6E2C4" stroke="#2A211C" strokeWidth={1} />
      <Path d="M23 5 L25 3 L29 7 L27 9 Z" fill="#F4F1EA" stroke="#2A211C" strokeWidth={1} />
      <Path d="M8 20 L12 24 L6 28 L4 24 Z" fill="#E7C99A" stroke="#2A211C" strokeWidth={1} />
      <Path d="M6 28 L4 24 L3 29 Z" fill="#2A211C" />
    </Svg>
  );
}

function StrokeLines({ strokes, paper }: { strokes: Stroke[]; paper: string }) {
  return (
    <>
      {strokes.map((stroke, index) => (
        <Polyline
          key={`${stroke.space ?? 'pad'}-${index}-${stroke.points.slice(0, 16)}`}
          points={stroke.points}
          fill="none"
          stroke={stroke.color === 'eraser' ? paper : stroke.color}
          strokeWidth={stroke.size ?? 3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

/** Old drawings stay in the little box they were made in. */
export function LegacyDrawing({ value, paper }: { value: string | null | undefined; paper: string }) {
  const strokes = padStrokes(strokesFrom(value));
  if (strokes.length === 0) return null;
  return (
    <View pointerEvents="none" style={{ height: 180, borderRadius: 16, overflow: 'hidden' }}>
      <Svg width="100%" height="100%">
        <StrokeLines strokes={strokes} paper={paper} />
      </Svg>
    </View>
  );
}

export function DrawingSurface({
  value,
  active,
  color,
  size,
  erase,
  paper,
  onChange,
}: {
  value: string | null | undefined;
  active: boolean;
  color: string;
  size: number;
  erase: boolean;
  paper: string;
  onChange: (next: string) => void;
}) {
  const strokes = strokesFrom(value);
  const pages = pageStrokes(strokes);
  const [current, setCurrent] = useState('');
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null);
  const [touching, setTouching] = useState(false);
  const host = useRef<any>(null);
  const live = useRef({ strokes, color, size, erase, onChange });
  live.current = { strokes, color, size, erase, onChange };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = host.current as HTMLElement | null;
    if (!node) return;
    node.setAttribute('data-drawing', active ? '1' : '0');
    if (!active) {
      node.style.cursor = '';
      return;
    }
    node.style.cursor = pencilCursorCss(erase ? paper : color);
    const pointers = new Set<number>();
    let points = '';
    const local = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const down = (event: PointerEvent) => {
      pointers.add(event.pointerId);
      if (pointers.size >= 2) {
        points = '';
        setCurrent('');
        node.style.pointerEvents = 'none';
        window.dispatchEvent(new CustomEvent('diary-draw-scroll', { detail: true }));
        return;
      }
      const spot = local(event);
      setTouching(true);
      setFinger(spot);
      points = `${spot.x.toFixed(0)},${spot.y.toFixed(0)}`;
      setCurrent(points);
    };
    const move = (event: PointerEvent) => {
      if (pointers.size !== 1 || !pointers.has(event.pointerId)) return;
      if (event.cancelable) event.preventDefault();
      const spot = local(event);
      setFinger(spot);
      points = `${points} ${spot.x.toFixed(0)},${spot.y.toFixed(0)}`;
      setCurrent(points);
    };
    const up = (event: PointerEvent) => {
      const wasDrawing = pointers.size === 1 && pointers.has(event.pointerId);
      pointers.delete(event.pointerId);
      if (pointers.size < 2) {
        node.style.pointerEvents = 'auto';
        window.dispatchEvent(new CustomEvent('diary-draw-scroll', { detail: false }));
      }
      if (!wasDrawing) return;
      setTouching(false);
      append(points);
      points = '';
      setCurrent('');
    };
    node.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      node.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [active, color, erase, paper]);

  function append(points: string) {
    if (!points) return;
    const stroke: Stroke = {
      points,
      color: live.current.erase ? 'eraser' : live.current.color,
      size: live.current.erase ? Math.max(live.current.size, 14) : live.current.size,
      space: 'page',
    };
    const next = [...live.current.strokes, stroke];
    live.current.onChange(JSON.stringify(next));
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        if ((event.nativeEvent.touches?.length ?? 1) > 1) return;
        const { locationX, locationY } = event.nativeEvent;
        setTouching(true);
        setFinger({ x: locationX, y: locationY });
        setCurrent(`${locationX.toFixed(0)},${locationY.toFixed(0)}`);
      },
      onPanResponderMove: (event) => {
        if ((event.nativeEvent.touches?.length ?? 1) > 1) {
          setCurrent('');
          return;
        }
        const { locationX, locationY } = event.nativeEvent;
        setFinger({ x: locationX, y: locationY });
        setCurrent((points) => (points ? `${points} ${locationX.toFixed(0)},${locationY.toFixed(0)}` : `${locationX.toFixed(0)},${locationY.toFixed(0)}`));
      },
      onPanResponderRelease: () => {
        setTouching(false);
        setCurrent((points) => {
          append(points);
          return '';
        });
      },
      onPanResponderTerminate: () => {
        setTouching(false);
        setCurrent('');
      },
    }),
  ).current;

  const ink = erase ? paper : color;
  return (
    <View
      ref={host}
      {...(active && Platform.OS !== 'web' ? responder.panHandlers : {})}
      pointerEvents={active ? 'auto' : 'none'}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 120, touchAction: active ? 'none' : 'auto' } as object}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <StrokeLines strokes={pages} paper={paper} />
        {current ? <Polyline points={current} fill="none" stroke={ink} strokeWidth={erase ? Math.max(size, 14) : size} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </Svg>
      {active && finger ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: finger.x - 3, top: finger.y - 29 }}>
          <PencilIcon color={ink} />
        </View>
      ) : null}
      {active && !touching && !finger ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 28, top: 36 }}>
          <PencilIcon color={ink} />
        </View>
      ) : null}
    </View>
  );
}

export function DrawingToolbar({
  color,
  size,
  erase,
  recent,
  scrolling,
  onColor,
  onSize,
  onErase,
  onScroll,
  onDone,
}: {
  color: string;
  size: number;
  erase: boolean;
  recent: string[];
  scrolling: boolean;
  onColor: (color: string) => void;
  onSize: (size: number) => void;
  onErase: (erase: boolean) => void;
  onScroll: (scroll: boolean) => void;
  onDone: () => void;
}) {
  const ink = erase ? '#F4F1EA' : color;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PencilIcon color={ink} />
          <Text style={{ fontFamily: 'System', color: '#3A2A32' }}>{erase ? 'Eraser' : 'Pencil'}</Text>
        </View>
        <Pressable accessibilityLabel="Done drawing" onPress={onDone} style={{ backgroundColor: '#8C2F39', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: '#FFFDF8', fontWeight: '700' }}>Done drawing</Text>
        </Pressable>
      </View>
      <HorizontalStrip contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
        {DRAW_COLORS.map((swatch) => (
          <Pressable key={swatch} accessibilityLabel={`Pen color ${DRAW_COLORS.indexOf(swatch) + 1}`} onPress={() => { onErase(false); onColor(swatch); }} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: swatch, borderWidth: !erase && color === swatch ? 3 : 1, borderColor: !erase && color === swatch ? '#111111' : '#FFFFFF' }} />
        ))}
      </HorizontalStrip>
      {recent.length > 0 ? (
        <HorizontalStrip contentContainerStyle={{ gap: 6 }}>
          {recent.map((swatch) => (
            <Pressable key={swatch} accessibilityLabel="Recent color" onPress={() => { onErase(false); onColor(swatch); }} style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: swatch, borderWidth: 1, borderColor: '#FFFFFF' }} />
          ))}
        </HorizontalStrip>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', height: 28, borderRadius: 8, overflow: 'hidden' }}>
          {Array.from({ length: 12 }, (_, index) => {
            const hue = index * 30;
            const swatch = `hsl(${hue} 70% 52%)`;
            return <Pressable key={hue} accessibilityLabel={`Custom hue ${hue}`} onPress={() => { onErase(false); onColor(hslHex(hue)); }} style={{ width: 22, backgroundColor: swatch }} />;
          })}
        </View>
        {PEN_SIZES.map((pen) => (
          <Pressable key={pen} accessibilityLabel={`Brush ${pen}`} onPress={() => onSize(pen)} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: size === pen && !erase ? '#3A2A32' : '#F7F1E8' }}>
            <View style={{ width: pen + 4, height: pen + 4, borderRadius: pen, backgroundColor: size === pen && !erase ? '#FFFDF8' : '#3A2A32' }} />
          </Pressable>
        ))}
        <Pressable accessibilityLabel="Eraser" onPress={() => onErase(!erase)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: erase ? '#3A2A32' : '#F7F1E8' }}>
          <Text style={{ color: erase ? '#FFFDF8' : '#3A2A32' }}>Eraser</Text>
        </Pressable>
        <Pressable accessibilityLabel={scrolling ? 'Back to drawing' : 'Two-finger scroll'} onPress={() => onScroll(!scrolling)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: scrolling ? '#1C3F6E' : '#F7F1E8' }}>
          <Text style={{ color: scrolling ? '#FFFDF8' : '#3A2A32' }}>{scrolling ? 'Back to drawing' : 'Scroll'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
