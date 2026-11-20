import { useMemo, useRef, type ReactNode } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { NotePlacement, NoteStyle, PhotoFrame, PhotoPlacement } from '../models/types';
import { useTheme } from '../theme/BookTheme';
import { fontById } from '../theme/fonts';

const BASE = 110;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function frameStyle(frame: PhotoFrame) {
  if (frame === 'polaroid') return { backgroundColor: '#fff', padding: 6, paddingBottom: 18, borderRadius: 2 };
  if (frame === 'tape') return { backgroundColor: '#fff', padding: 4, borderRadius: 2 };
  if (frame === 'round') return { borderRadius: 18, overflow: 'hidden' as const, borderWidth: 3, borderColor: '#fff' };
  return { borderRadius: 6, overflow: 'hidden' as const };
}

function noteChrome(style: NoteStyle): { backgroundColor: string; borderRadius: number; padding: number } {
  if (style === 'sticky') return { backgroundColor: '#FFE38A', borderRadius: 6, padding: 8 };
  if (style === 'bubble') return { backgroundColor: '#fff', borderRadius: 16, padding: 8 };
  if (style === 'tag') return { backgroundColor: '#F4A3B8', borderRadius: 999, padding: 8 };
  if (style === 'torn') return { backgroundColor: '#F7F1E1', borderRadius: 2, padding: 8 };
  if (style === 'highlight') return { backgroundColor: 'rgba(255, 227, 138, 0.72)', borderRadius: 4, padding: 4 };
  return { backgroundColor: 'transparent', borderRadius: 4, padding: 4 };
}

function PlacedBox({
  x,
  y,
  scale,
  rotation,
  pageWidth,
  pageHeight,
  zIndex,
  selected,
  onSelect,
  onMove,
  captureTap = true,
  children,
}: {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  pageWidth: number;
  pageHeight: number;
  zIndex: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (next: { x: number; y: number; scale: number; rotation: number }) => void;
  captureTap?: boolean;
  children: ReactNode;
}) {
  const live = useRef({ x, y, scale, rotation });
  live.current = { x, y, scale, rotation };
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const sizeRef = useRef({ w: pageWidth, h: pageHeight });
  sizeRef.current = { w: pageWidth, h: pageHeight };
  const origin = useRef(live.current);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => captureTap && event.nativeEvent.touches.length < 2,
        onMoveShouldSetPanResponder: (event, gesture) => event.nativeEvent.touches.length < 2 && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 2,
        onPanResponderTerminationRequest: (event) => event.nativeEvent.touches.length > 1,
        onPanResponderGrant: () => {
          selectRef.current();
          origin.current = { ...live.current };
        },
        onPanResponderMove: (_, gesture) => {
          const width = sizeRef.current.w || 1;
          const height = sizeRef.current.h || 1;
          moveRef.current({
            ...live.current,
            x: clamp(origin.current.x + gesture.dx / width, 0.06, 0.94),
            y: clamp(origin.current.y + gesture.dy / height, 0.06, 0.94),
          });
        },
      }),
    [captureTap],
  );

  const scalePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          origin.current = { ...live.current };
        },
        onPanResponderMove: (_, gesture) => {
          moveRef.current({ ...live.current, scale: clamp(origin.current.scale + gesture.dx / 90, 0.45, 2.6) });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  if (pageWidth < 20) return null;
  const size = BASE * scale;
  return (
    <View {...pan.panHandlers} style={{ position: 'absolute', left: x * pageWidth - size / 2, top: y * pageHeight - size / 2, width: size, transform: [{ rotate: `${rotation}deg` }], zIndex }}>
      {children}
      {selected ? <View {...scalePan.panHandlers} style={styles.knob} /> : null}
      {selected ? <View style={styles.turn} onTouchEnd={() => moveRef.current({ ...live.current, rotation: (live.current.rotation + 15) % 360 })} /> : null}
    </View>
  );
}

export function PhotoNoteLayer({
  photos,
  notes,
  width,
  height,
  textZ,
  selectedId,
  onSelect,
  onChangePhoto,
  onChangeNote,
  onEditNote,
  onEditing,
}: {
  photos: PhotoPlacement[];
  notes: NotePlacement[];
  width: number;
  height: number;
  textZ: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChangePhoto: (next: PhotoPlacement) => void;
  onChangeNote: (next: NotePlacement) => void;
  onEditNote: (id: string, text: string) => void;
  onEditing: (editing: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <>
      {photos.map((photo) => {
        const front = (photo.z ?? textZ + 1) >= textZ;
        return (
          <PlacedBox
            key={photo.id}
            x={photo.x}
            y={photo.y}
            scale={photo.scale}
            rotation={photo.rotation}
            pageWidth={width}
            pageHeight={height}
            zIndex={front ? 22 + (photo.z ?? 0) : 4}
            selected={selectedId === photo.id}
            onSelect={() => onSelect(photo.id)}
            onMove={(next) => onChangePhoto({ ...photo, ...next })}
          >
            <View style={[frameStyle(photo.frame), { width: '100%' }]}>
              {photo.frame === 'tape' ? <View style={styles.tape} /> : null}
              <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 1, borderRadius: photo.frame === 'round' ? 16 : 0 }} />
            </View>
          </PlacedBox>
        );
      })}
      {notes.map((note) => {
        const front = (note.z ?? textZ + 1) >= textZ;
        const chrome = noteChrome(note.style);
        const font = fontById(note.fontId);
        return (
          <PlacedBox
            key={note.id}
            x={note.x}
            y={note.y}
            scale={note.scale}
            rotation={note.rotation}
            pageWidth={width}
            pageHeight={height}
            zIndex={front ? 22 + (note.z ?? 0) : 4}
            selected={selectedId === note.id}
            onSelect={() => onSelect(note.id)}
            onMove={(next) => onChangeNote({ ...note, ...next })}
            captureTap={false}
          >
            <View style={[chrome, { width: '100%' }, note.style === 'torn' && { borderWidth: 1, borderStyle: 'dashed', borderColor: '#C4B49A' }]}>
              {selectedId === note.id ? (
                <TextInput
                  value={note.text}
                  onChangeText={(text) => onEditNote(note.id, text)}
                  onFocus={() => onEditing(true)}
                  onBlur={() => onEditing(false)}
                  multiline
                  style={{ color: note.inkColor || theme.colors.paperInk, fontFamily: font?.script ?? theme.script, fontSize: 16, minWidth: 80 }}
                />
              ) : (
                <Pressable onPress={() => onSelect(note.id)}>
                  <Text style={{ color: note.inkColor || theme.colors.paperInk, fontFamily: font?.script ?? theme.script, fontSize: 16 }}>{note.text || 'Note'}</Text>
                </Pressable>
              )}
            </View>
          </PlacedBox>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  knob: { position: 'absolute', right: -6, bottom: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#E2B23A', borderWidth: 2, borderColor: '#fff' },
  turn: { position: 'absolute', left: -6, bottom: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#7AA2E3', borderWidth: 2, borderColor: '#fff' },
  tape: { position: 'absolute', top: -8, alignSelf: 'center', width: 36, height: 12, backgroundColor: 'rgba(255, 214, 160, 0.85)', transform: [{ rotate: '-4deg' }] },
});
