import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { activeMetal, metalById, shouldAnimate, shineHex, swatchHex, type ColorDesign } from '../theme/designs';
import { useReduceMotion } from '../theme/useReduceMotion';

export function PatternFill({ design, style }: { design: ColorDesign; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const gid = useId().replace(/:/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const travel = useRef(new Animated.Value(0)).current;
  const animate = shouldAnimate(design, reduce);
  const metal = activeMetal(design);
  const width = Math.max(size.width, 1);
  const height = Math.max(size.height, 1);

  useEffect(() => {
    if (!animate) return;
    travel.setValue(0);
    const loop = Animated.loop(
      Animated.timing(travel, { toValue: 1, duration: design.motion === 'shimmer' ? 1700 : 4800, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, design.motion, design.metal, travel]);

  const slide = travel.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  const pulse = travel.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.18, 0.72, 0.18] });
  const a = swatchHex(design.colorA);
  const b = swatchHex(design.colorB);
  const sheen = metal ? metalById(metal).shine : '#FFFFFF';

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: a }, style]}
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
    >
      {size.width > 0 ? (
        <Svg width={width} height={height}>
          <PatternArt id={gid} design={design} width={width} height={height} />
          {!animate && metal ? <Rect x={width * 0.15} y={-height * 0.2} width={width * 0.18} height={height * 1.4} fill={sheen} opacity={0.35} transform={`rotate(18 ${width / 2} ${height / 2})`} /> : null}
        </Svg>
      ) : null}
      {animate && design.motion === 'flow' ? (
        <Animated.View style={[styles.wide, { width: width * 2, transform: [{ translateX: slide }] }]}>
          <LinearGradient colors={[a, b, a]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      {animate && design.motion === 'scroll' ? (
        <Animated.View style={[styles.wide, { width: width * 2, opacity: 0.85, transform: [{ translateX: slide }] }]}>
          <Svg width={width * 2} height={height}>
            {stripeRects(width * 2, height, b)}
          </Svg>
        </Animated.View>
      ) : null}
      {animate && design.motion === 'drift' ? (
        <Animated.View style={[styles.wide, { width: width * 2, height: height * 1.4, transform: [{ translateX: slide }, { translateY: Animated.multiply(travel, -height * 0.25) }] }]}>
          <Svg width={width * 2} height={height * 1.4}>
            {driftShapes(width * 2, height * 1.4, design.pattern === 'hearts' ? 'hearts' : 'dots', b)}
          </Svg>
        </Animated.View>
      ) : null}
      {animate && design.motion === 'wave' ? (
        <Animated.View style={[styles.wide, { width: width * 2, transform: [{ translateX: slide }] }]}>
          <Svg width={width * 2} height={height}>
            <Path d={wavePath(width * 2, height, 0.35)} stroke={b} strokeWidth={8} fill="none" opacity={0.7} />
            <Path d={wavePath(width * 2, height, 0.62)} stroke={shineHex(design.colorB)} strokeWidth={5} fill="none" opacity={0.8} />
          </Svg>
        </Animated.View>
      ) : null}
      {animate && (design.motion === 'shimmer' || metal) ? (
        <Animated.View style={[styles.sheen, { opacity: design.motion === 'shimmer' || metal ? pulse : 0.4, transform: [{ translateX: slide }, { rotate: '18deg' }] }]}>
          <LinearGradient colors={['transparent', sheen, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      {animate && metal
        ? [0.2, 0.45, 0.7, 0.32, 0.58].map((x, index) => (
            <Animated.View
              key={x}
              style={{
                position: 'absolute',
                left: `${x * 100}%`,
                top: `${(0.18 + index * 0.15) * 100}%`,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: sheen,
                opacity: pulse,
              }}
            />
          ))
        : null}
    </View>
  );
}

function PatternArt({ id, design, width, height }: { id: string; design: ColorDesign; width: number; height: number }) {
  const a = swatchHex(design.colorA);
  const b = swatchHex(design.colorB);
  const linear = `${id}-lin`;
  const radial = `${id}-rad`;
  if (design.pattern === 'solid') return <Rect width={width} height={height} fill={a} />;
  if (design.pattern === 'split') {
    return (
      <>
        <Rect width={width / 2} height={height} fill={a} />
        <Rect x={width / 2} width={width / 2} height={height} fill={b} />
      </>
    );
  }
  if (design.pattern === 'stripes-h' || design.pattern === 'stripes-v') {
    return (
      <>
        <Rect width={width} height={height} fill={a} />
        {stripeRects(width, height, b, design.pattern === 'stripes-v')}
      </>
    );
  }
  if (design.pattern === 'stripes-d') {
    return (
      <>
        <Rect width={width} height={height} fill={a} />
        <G rotation={-32} origin={`${width / 2}, ${height / 2}`}>
          {stripeRects(width * 2, height * 2, b)}
        </G>
      </>
    );
  }
  if (design.pattern === 'gradient-linear' || design.pattern === 'gradient-radial') {
    return (
      <>
        <Defs>
          <SvgLinear id={linear} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </SvgLinear>
          <RadialGradient id={radial} cx="50%" cy="40%" r="70%">
            <Stop offset="0" stopColor={b} />
            <Stop offset="1" stopColor={a} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${design.pattern === 'gradient-radial' ? radial : linear})`} />
      </>
    );
  }
  if (design.pattern === 'dots') return <><Rect width={width} height={height} fill={a} />{driftShapes(width, height, 'dots', b)}</>;
  if (design.pattern === 'checkers') {
    const cell = 18;
    const rects = [];
    for (let y = 0; y < height + cell; y += cell) {
      for (let x = 0; x < width + cell; x += cell) {
        if ((Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0) rects.push(<Rect key={`${x}-${y}`} x={x} y={y} width={cell} height={cell} fill={b} />);
      }
    }
    return <><Rect width={width} height={height} fill={a} />{rects}</>;
  }
  if (design.pattern === 'chevron') {
    const lines: ReactNode[] = [];
    for (let y = 0; y < height + 28; y += 22) {
      lines.push(<Path key={y} d={`M0 ${y + 12} L18 ${y} L36 ${y + 12} L54 ${y} L72 ${y + 12}`} stroke={b} strokeWidth={4} fill="none" />);
    }
    return (
      <>
        <Rect width={width} height={height} fill={a} />
        {Array.from({ length: Math.ceil(width / 72) + 1 }, (_, index) => (
          <G key={index} x={index * 72}>
            {lines}
          </G>
        ))}
      </>
    );
  }
  return (
    <>
      <Rect width={width} height={height} fill={a} />
      {driftShapes(width, height, design.pattern === 'stars' ? 'stars' : 'hearts', b)}
    </>
  );
}

function stripeRects(width: number, height: number, color: string, vertical = false) {
  const band = 14;
  const rects = [];
  if (vertical) {
    for (let x = 0; x < width + band; x += band * 2) rects.push(<Rect key={x} x={x} width={band} height={height} fill={color} />);
  } else {
    for (let y = 0; y < height + band; y += band * 2) rects.push(<Rect key={y} y={y} width={width} height={band} fill={color} />);
  }
  return rects;
}

function driftShapes(width: number, height: number, kind: 'dots' | 'hearts' | 'stars', color: string) {
  const nodes = [];
  const step = kind === 'dots' ? 22 : 36;
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      if (kind === 'dots') nodes.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill={color} />);
      else if (kind === 'stars') nodes.push(<Path key={`${x}-${y}`} d={starPath(x, y, 8)} fill={color} />);
      else nodes.push(<Path key={`${x}-${y}`} d={heartPath(x, y, 8)} fill={color} />);
    }
  }
  return nodes;
}

function heartPath(cx: number, cy: number, s: number): string {
  return `M ${cx} ${cy + s * 0.7} C ${cx - s} ${cy} ${cx - s * 0.5} ${cy - s} ${cx} ${cy - s * 0.25} C ${cx + s * 0.5} ${cy - s} ${cx + s} ${cy} ${cx} ${cy + s * 0.7} Z`;
}

function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const rad = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + Math.cos(rad) * rr).toFixed(1)} ${(cy + Math.sin(rad) * rr).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

function wavePath(width: number, height: number, across: number): string {
  const y = height * across;
  let d = `M 0 ${y}`;
  for (let x = 0; x <= width; x += 24) d += ` Q ${x + 12} ${y + (x / 24) % 2 === 0 ? -16 : 16} ${x + 24} ${y}`;
  return d;
}

const styles = StyleSheet.create({
  wide: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  sheen: { position: 'absolute', top: '-20%', width: 72, height: '140%' },
});
