import { useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

type Stroke = { points: string; color: string };

export function strokesFrom(raw: string | null | undefined): Stroke[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Stroke[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DrawingPad({ value, color, onChange }: { value: string | null | undefined; color: string; onChange: (next: string) => void }) {
  const [strokes, setStrokes] = useState<Stroke[]>(() => strokesFrom(value));
  const [current, setCurrent] = useState('');
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      setCurrent(`${locationX.toFixed(0)},${locationY.toFixed(0)}`);
    },
    onPanResponderMove: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      setCurrent((points) => `${points} ${locationX.toFixed(0)},${locationY.toFixed(0)}`);
    },
    onPanResponderRelease: () => {
      setCurrent((points) => {
        if (!points) return '';
        const next = [...strokes, { points, color }];
        setStrokes(next);
        onChange(JSON.stringify(next));
        return '';
      });
    },
  });
  return (
    <View {...responder.panHandlers} style={{ height: 180, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' }}>
      <Svg width="100%" height="100%">
        {strokes.map((stroke, index) => (
          <Polyline key={`${index}-${stroke.points.slice(0, 12)}`} points={stroke.points} fill="none" stroke={stroke.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {current ? <Polyline points={current} fill="none" stroke={color} strokeWidth={3} /> : null}
      </Svg>
    </View>
  );
}
