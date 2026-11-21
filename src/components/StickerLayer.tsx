import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { holdDecoration } from '../logic/pageGesture';
import { clampStickerPosition, pointerAngle, rotationFromDrag } from '../logic/stickerPlacement';
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
  const spin = useRef({ rotation: 0, vx: 0, vy: 0 });
  const twist = useRef<{ angle: number; rotation: number } | null>(null);
  const rotationOf = (item: StickerPlacement) => (Number.isFinite(item.rotation) ? item.rotation : 0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (event, gesture) => event.nativeEvent.touches.length > 1 || Math.abs(gesture.dx) + Math.abs(gesture.dy) > 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          holdDecoration(true);
          twist.current = null;
          selectRef.current(live.current.id);
          origin.current = { x: live.current.x, y: live.current.y, scale: live.current.scale };
        },
        onPanResponderRelease: () => {
          twist.current = null;
          holdDecoration(false);
        },
        onPanResponderTerminate: () => {
          twist.current = null;
          holdDecoration(false);
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches ?? [];
          if (touches.length >= 2) {
            const angle = pointerAngle(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
            if (!twist.current) twist.current = { angle, rotation: rotationOf(live.current) };
            changeRef.current({ ...live.current, rotation: rotationFromDrag(twist.current.rotation, twist.current.angle, angle) });
            return;
          }
          const width = sizeRef.current.w || 1;
          const height = sizeRef.current.h || 1;
          const next = clampStickerPosition(origin.current.x + gesture.dx / width, origin.current.y + gesture.dy / height);
          changeRef.current({ ...live.current, ...next });
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
          holdDecoration(true);
          origin.current = { x: live.current.x, y: live.current.y, scale: live.current.scale };
        },
        onPanResponderRelease: () => holdDecoration(false),
        onPanResponderTerminate: () => holdDecoration(false),
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

  const turnPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          holdDecoration(true);
          const size = BASE * live.current.scale;
          const localX = 3 - size / 2;
          const localY = size / 2 - 3;
          const radians = (rotationOf(live.current) * Math.PI) / 180;
          spin.current = {
            rotation: rotationOf(live.current),
            vx: localX * Math.cos(radians) - localY * Math.sin(radians),
            vy: localX * Math.sin(radians) + localY * Math.cos(radians),
          };
        },
        onPanResponderRelease: () => holdDecoration(false),
        onPanResponderTerminate: () => holdDecoration(false),
        onPanResponderMove: (_, gesture) => {
          const start = (Math.atan2(spin.current.vy, spin.current.vx) * 180) / Math.PI;
          const current = (Math.atan2(spin.current.vy + gesture.dy, spin.current.vx + gesture.dx) * 180) / Math.PI;
          changeRef.current({ ...live.current, rotation: rotationFromDrag(spin.current.rotation, start, current) });
        },
      }),
    [],
  );

  if (pageWidth < 20 || pageHeight < 20) return null;
  const size = BASE * placement.scale;
  return (
    <View
      {...(decorate ? pan.panHandlers : {})}
      pointerEvents={decorate ? 'auto' : 'none'}
      ref={(node) => {
        (node as { setAttribute?: (name: string, value: string) => void } | null)?.setAttribute?.('data-decoration', '1');
      }}
      style={{
        position: 'absolute',
        left: placement.x * pageWidth - size / 2,
        top: placement.y * pageHeight - size / 2,
        width: size,
        height: size,
        transform: [{ rotate: `${rotationOf(placement)}deg` }],
        zIndex,
        touchAction: 'none',
      } as object}
    >
      <StickerView stickerId={placement.stickerId} size={size} selected={selected} />
      {selected ? <View {...scalePan.panHandlers} style={styles.knob} /> : null}
      {selected ? <View {...turnPan.panHandlers} accessibilityLabel="Rotate sticker" style={styles.turn} /> : null}
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
  onDeselect,
}: {
  stickers: StickerPlacement[];
  width: number;
  height: number;
  decorate: boolean;
  selectedId: string | null;
  textZ: number;
  onSelect: (id: string) => void;
  onChange: (next: StickerPlacement) => void;
  onDeselect?: () => void;
}) {
  return (
    <>
      {decorate ? <Pressable accessibilityLabel="Page" onPress={onDeselect} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} /> : null}
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
