import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useTheme } from '../theme/BookTheme';
import type { Theme } from '../theme/themes';
import { PatternFill } from './PatternFill';

function Pattern({ theme, width, height }: { theme: Theme; width: number; height: number }) {
  if (width < 10 || height < 10 || theme.paper === 'plain') return null;
  if (theme.paper === 'lined' || theme.paper === 'parchment') {
    const lines = [];
    for (let y = 28; y < height; y += 28) {
      lines.push(<Line key={y} x1={18} x2={width - 14} y1={y} y2={y} stroke={theme.colors.line} strokeWidth={1} />);
    }
    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {theme.paper === 'parchment' ? <Rect width={width} height={height} fill={theme.colors.accent} opacity={0.05} /> : null}
        {lines}
      </Svg>
    );
  }
  if (theme.paper === 'dotted') {
    const dots = [];
    for (let y = 18; y < height; y += 22) {
      for (let x = 18; x < width; x += 22) dots.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={theme.colors.line} />);
    }
    return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{dots}</Svg>;
  }
  const grid = [];
  for (let y = 20; y < height; y += 22) grid.push(<Line key={`h${y}`} x1={0} x2={width} y1={y} y2={y} stroke={theme.colors.line} strokeWidth={1} />);
  for (let x = 20; x < width; x += 22) grid.push(<Line key={`v${x}`} x1={x} x2={x} y1={0} y2={height} stroke={theme.colors.line} strokeWidth={1} />);
  return <Svg width={width} height={height} style={StyleSheet.absoluteFill}>{grid}</Svg>;
}

function Corner({ theme }: { theme: Theme }) {
  if (theme.decor === 'none') return null;
  const color = theme.colors.accent;
  return (
    <Svg width={54} height={54} style={styles.corner}>
      {theme.decor === 'hearts' ? <Path d="M27 40 C14 28 16 16 27 22 C38 16 40 28 27 40 Z" fill={color} opacity={0.35} /> : null}
      {theme.decor === 'bats' ? <Path d="M27 30 C18 22 8 26 8 18 C16 20 20 14 22 22 C24 14 30 16 30 24 C30 16 36 14 38 22 C40 14 46 20 46 18 C46 26 36 22 27 30 Z" fill={color} opacity={0.45} /> : null}
      {theme.decor === 'sparkles' || theme.decor === 'stars' ? <Path d="M27 8 L30 20 L42 23 L30 26 L27 40 L24 26 L12 23 L24 20 Z" fill={theme.colors.accent3} opacity={0.7} /> : null}
      {theme.decor === 'leaves' ? <Path d="M30 8 C44 18 42 36 28 44 C18 30 18 16 30 8 Z" fill={color} opacity={0.4} /> : null}
      {theme.decor === 'waves' ? <Path d="M6 30 Q16 18 26 30 T46 30" stroke={color} strokeWidth={3} fill="none" /> : null}
      {theme.decor === 'books' ? <Rect x={14} y={12} width={26} height={30} rx={2} fill={color} opacity={0.35} /> : null}
      {theme.decor === 'blossoms' ? <Circle cx={28} cy={24} r={8} fill={color} opacity={0.4} /> : null}
      {theme.decor === 'rainbow' ? (
        <>
          <Path d="M8 36 A16 16 0 0 1 40 36" stroke="#FF6B6B" strokeWidth={3} fill="none" />
          <Path d="M12 36 A12 12 0 0 1 36 36" stroke="#FFE66D" strokeWidth={3} fill="none" />
          <Path d="M16 36 A8 8 0 0 1 32 36" stroke="#4ECDC4" strokeWidth={3} fill="none" />
        </>
      ) : null}
    </Svg>
  );
}

export function Paper({ children, style, showLines = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; showLines?: boolean }) {
  const theme = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
      style={[
        styles.page,
        {
          backgroundColor: theme.colors.paper,
          borderColor: theme.colors.paperEdge,
          borderRadius: theme.radius,
        },
        style,
      ]}
    >
      {theme.design ? <PatternFill design={theme.design} /> : null}
      <View style={[styles.binding, { backgroundColor: theme.colors.binding }]} />
      {showLines ? <Pattern theme={theme} width={size.width} height={size.height} /> : null}
      <View style={[styles.tape, { backgroundColor: theme.colors.tape }]} />
      <Corner theme={theme} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 280,
    shadowColor: '#3A2A32',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  binding: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 14 },
  tape: { position: 'absolute', top: 12, left: 36, width: 74, height: 18, borderRadius: 3, opacity: 0.85, transform: [{ rotate: '-6deg' }] },
  corner: { position: 'absolute', right: 6, top: 6 },
});
