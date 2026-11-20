import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import type { StickerPlacement } from '../models/types';
import { StickerView } from '../stickers/StickerView';

const BASE = 88;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PlacedSticker({
  placement,
  pageWidth,
  pageHeight,
  decorate,
  selected,
  zIndex,
  onSelect,
  onChange,
}: {
  placement: StickerPlacement;
  pageWidth: number;
  pageHeight: number;
  decorate: boolean;
  selected: boolean;
  zIndex: number;
  onSelect: (id: string) => void;
  onChange: (next: StickerPlacement) => void;
}) {
  const live = useRef(placement);
  live.current = placement;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const sizeRef = useRef({ w: pageWidth, h: pageHeight });
  sizeRef.current = { w: pageWidth, h: pageHeight };
  const origin = useRef({ x: placement.x, y: placement.y, scale: placement.scale });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length < 2,
        onMoveShouldSetPanResponder: (event, gesture) => event.nativeEvent.touches.length < 2 && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 2,
        onPanResponderTerminationRequest: (event) => event.nativeEvent.touches.length > 1,
        onPanResponderGrant: () => {
          selectRef.current(live.current.id);
          origin.current = { x: live.current.x, y: live.current.y, scale: live.current.scale };
        },
        onPanResponderMove: (_, gesture) => {
          const width = sizeRef.current.w || 1;
          const height = sizeRef.current.h || 1;
          changeRef.current({
            ...live.current,
            x: clamp(origin.current.x + gesture.dx / width, 0.08, 0.92),
            y: clamp(origin.current.y + gesture.dy / height, 0.08, 0.92),
          });
        },
      }),
    [],
  );

  const scalePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          origin.current = { x: live.current.x, y: live.current.y, scale: live.current.scale };
        },
        onPanResponderMove: (_, gesture) => {
          changeRef.current({
            ...live.current,
            scale: clamp(origin.current.scale + gesture.dx / 90, 0.45, 2.3),
          });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  if (pageWidth < 20 || pageHeight < 20) return null;
  const size = BASE * placement.scale;
  return (
    <View
      {...pan.panHandlers}
      style={{
        position: 'absolute',
        left: placement.x * pageWidth - size / 2,
        top: placement.y * pageHeight - size / 2,
        width: size,
        height: size,
        transform: [{ rotate: `${placement.rotation}deg` }],
        zIndex,
      }}
    >
      <StickerView stickerId={placement.stickerId} size={size} selected={selected} />
      {selected ? <View {...scalePan.panHandlers} style={styles.knob} /> : null}
      {selected ? (
        <View
          style={styles.turn}
          onTouchEnd={() => changeRef.current({ ...live.current, rotation: (live.current.rotation + 15) % 360 })}
        />
      ) : null}
    </View>
  );
}

export function StickerLayer({
  stickers,
  width,
  height,
  decorate,
  selectedId,
  textZ,
  onSelect,
  onChange,
}: {
  stickers: StickerPlacement[];
  width: number;
  height: number;
  decorate: boolean;
  selectedId: string | null;
  textZ: number;
  onSelect: (id: string) => void;
  onChange: (next: StickerPlacement) => void;
}) {
  return (
    <>
      {stickers.map((placement) => (
        <PlacedSticker
          key={placement.id}
          placement={placement}
          pageWidth={width}
          pageHeight={height}
          decorate={decorate}
          selected={placement.id === selectedId}
          zIndex={(placement.z ?? textZ + 1) < textZ ? 4 : 22 + (placement.z ?? 0)}
          onSelect={onSelect}
          onChange={onChange}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  knob: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2B23A',
    borderWidth: 2,
    borderColor: '#fff',
  },
  turn: {
    position: 'absolute',
    left: -8,
    bottom: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7AA2E3',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
