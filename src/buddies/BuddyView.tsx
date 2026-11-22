import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { getMood, type MoodId } from '../data/moods';
import { playBuddySound } from '../services/sounds';
import { useTheme } from '../theme/BookTheme';
import { useReduceMotion } from '../theme/useReduceMotion';
import {
  buddyLine,
  getBuddy,
  ghostyOpacity,
  novaGlow,
  sproutBlooms,
  type BuddyContext,
  type BuddyDef,
} from './catalog';

type DrawProps = BuddyContext & { anchors: BuddyDef['anchors']; outfits: string[] };

const MotionCtx = createContext({ blink: false });

function Face({
  cx,
  cy,
  mood,
  scale = 1,
  looking = 0,
  sleepy = false,
}: {
  cx: number;
  cy: number;
  mood: MoodId;
  scale?: number;
  looking?: number;
  sleepy?: boolean;
}) {
  const { blink } = useContext(MotionCtx);
  const gap = 14 * scale;
  const y = cy - 2 * scale;
  const lx = cx - gap + looking;
  const rx = cx + gap + looking;
  const ink = '#3A2A32';
  const blush = mood === 'angry' ? '#E07A72' : '#F4A4B8';
  const starry = mood === 'happy' || mood === 'excited' || mood === 'hopeful' || mood === 'fired';
  const soft = sleepy || mood === 'tired' || mood === 'calm';
  const radius = (mood === 'excited' || mood === 'anxious' || mood === 'fired' ? 6.6 : 5.6) * scale;
  const eye = blink ? (
    <G>
      <Path d={`M ${lx - 8} ${y} Q ${lx} ${y + 1.5} ${lx + 8} ${y}`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d={`M ${rx - 8} ${y} Q ${rx} ${y + 1.5} ${rx + 8} ${y}`} stroke={ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </G>
  ) : soft ? (
    <G>
      <Path d={`M ${lx - 8} ${y} Q ${lx} ${y + 6} ${lx + 8} ${y}`} stroke={ink} strokeWidth={2.3} fill="none" strokeLinecap="round" />
      <Path d={`M ${rx - 8} ${y} Q ${rx} ${y + 6} ${rx + 8} ${y}`} stroke={ink} strokeWidth={2.3} fill="none" strokeLinecap="round" />
    </G>
  ) : mood === 'grateful' || mood === 'loved' ? (
    <G>
      <Path d={`M ${lx} ${y + 5} C ${lx - 7} ${y - 5} ${lx - 2} ${y - 6} ${lx} ${y - 1} C ${lx + 2} ${y - 6} ${lx + 7} ${y - 5} ${lx} ${y + 5}`} fill="#E85D78" />
      <Path d={`M ${rx} ${y + 5} C ${rx - 7} ${y - 5} ${rx - 2} ${y - 6} ${rx} ${y - 1} C ${rx + 2} ${y - 6} ${rx + 7} ${y - 5} ${rx} ${y + 5}`} fill="#E85D78" />
      <Circle cx={lx - 2} cy={y - 2} r={1.3} fill="#fff" />
      <Circle cx={rx - 2} cy={y - 2} r={1.3} fill="#fff" />
    </G>
  ) : starry ? (
    <G>
      <Polygon points={`${lx},${y - radius} ${lx + 1.8},${y - 1.4} ${lx + radius},${y} ${lx + 1.8},${y + 1.4} ${lx},${y + radius} ${lx - 1.8},${y + 1.4} ${lx - radius},${y} ${lx - 1.8},${y - 1.4}`} fill="#F6C445" />
      <Polygon points={`${rx},${y - radius} ${rx + 1.8},${y - 1.4} ${rx + radius},${y} ${rx + 1.8},${y + 1.4} ${rx},${y + radius} ${rx - 1.8},${y + 1.4} ${rx - radius},${y} ${rx - 1.8},${y - 1.4}`} fill="#F6C445" />
      <Circle cx={lx - 1.4} cy={y - 1.6} r={1.5} fill="#fff" />
      <Circle cx={rx - 1.4} cy={y - 1.6} r={1.5} fill="#fff" />
    </G>
  ) : (
    <G>
      <Circle cx={lx} cy={y} r={radius} fill={ink} />
      <Circle cx={rx} cy={y} r={radius} fill={ink} />
      <Circle cx={lx - radius * 0.35} cy={y - radius * 0.38} r={1.8} fill="#fff" />
      <Circle cx={rx - radius * 0.35} cy={y - radius * 0.38} r={1.8} fill="#fff" />
    </G>
  );
  const mouthY = cy + 10 * scale;
  const smile = mood === 'sad' || mood === 'angry';
  const mouth = mood === 'anxious' ? (
    <Path d={`M ${cx - 6} ${mouthY} Q ${cx - 2} ${mouthY - 3} ${cx} ${mouthY} T ${cx + 6} ${mouthY}`} stroke={ink} strokeWidth={1.7} fill="none" />
  ) : mood === 'tired' ? (
    <Ellipse cx={cx} cy={mouthY} rx={3} ry={2.2} fill={ink} />
  ) : (
    <Path
      d={
        smile
          ? `M ${cx - 6} ${mouthY + 2} Q ${cx} ${mouthY - 4} ${cx + 6} ${mouthY + 2}`
          : `M ${cx - 7} ${mouthY - 1} Q ${cx} ${mouthY + (mood === 'excited' || mood === 'fired' ? 8 : 5)} ${cx + 7} ${mouthY - 1}`
      }
      stroke={ink}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
    />
  );
  return (
    <G>
      {mood === 'angry' ? (
        <G>
          <Line x1={lx - 5} y1={y - 7} x2={lx + 4} y2={y - 4} stroke={ink} strokeWidth={1.6} />
          <Line x1={rx + 5} y1={y - 7} x2={rx - 4} y2={y - 4} stroke={ink} strokeWidth={1.6} />
        </G>
      ) : null}
      {eye}
      <Ellipse cx={lx - 2} cy={y + 8} rx={4.5} ry={2.2} fill={blush} opacity={0.8} />
      <Ellipse cx={rx + 2} cy={y + 8} rx={4.5} ry={2.2} fill={blush} opacity={0.8} />
      {mouth}
    </G>
  );
}

function flower(x: number, y: number, fill: string, size = 7) {
  return (
    <G key={`${x}-${y}`}>
      <Circle cx={x - size} cy={y} r={size * 0.55} fill={fill} />
      <Circle cx={x + size} cy={y} r={size * 0.55} fill={fill} />
      <Circle cx={x} cy={y - size} r={size * 0.55} fill={fill} />
      <Circle cx={x} cy={y + size} r={size * 0.55} fill={fill} />
      <Circle cx={x} cy={y} r={size * 0.38} fill="#F2C14E" />
    </G>
  );
}

function Outfits({ ids, anchors, behind }: { ids: string[]; anchors: BuddyDef['anchors']; behind?: boolean }) {
  return (
    <G>
      {ids.map((id) => (
        <G key={id}>{drawOutfit(id, anchors, behind ? 'back' : 'front')}</G>
      ))}
    </G>
  );
}

/** Positive distance moves away from the face, along the crown. */
function crown(anchors: BuddyDef['anchors'], distance: number) {
  return distance * (anchors.lift ?? -1);
}

function drawOutfit(id: string, anchors: BuddyDef['anchors'], layer: 'back' | 'front') {
  const hat = anchors.hat;
  const neck = anchors.neck;
  const face = anchors.face;
  const pin = anchors.pin;
  const s = anchors.scale ?? 1;
  const lift = anchors.lift ?? -1;
  if (id === 'cape') {
    const x = neck.x;
    const y = neck.y;
    const dir = -lift;
    if (layer === 'back') {
      const mid = y + 22 * dir * s;
      const hem = y + 50 * dir * s;
      return (
        <G>
          <Path
            d={`M ${x - 12 * s} ${y} Q ${x - 58 * s} ${mid} ${x - 36 * s} ${hem} L ${x - 6 * s} ${y + 8 * dir * s} Z`}
            fill="#6E3050"
          />
          <Path
            d={`M ${x + 12 * s} ${y} Q ${x + 58 * s} ${mid} ${x + 36 * s} ${hem} L ${x + 6 * s} ${y + 8 * dir * s} Z`}
            fill="#8E4064"
          />
          <Path
            d={`M ${x - 30 * s} ${hem} L ${x - 36 * s} ${hem} L ${x - 34 * s} ${hem - 8 * dir * s}`}
            stroke="#F2C14E"
            strokeWidth={1.4 * s}
            fill="none"
          />
        </G>
      );
    }
    return (
      <G>
        <Path d={`M ${x - 14 * s} ${y - 1 * s} Q ${x} ${y + 6 * dir * s} ${x + 14 * s} ${y - 1 * s}`} stroke="#E7C16A" strokeWidth={3.2 * s} fill="none" strokeLinecap="round" />
        <Circle cx={x} cy={y + 1 * dir * s} r={3.6 * s} fill="#F2C14E" stroke="#8A6420" strokeWidth={0.8} />
      </G>
    );
  }
  if (layer === 'back') return null;
  if (id === 'bow') {
    const x = hat.x;
    const y = hat.y;
    return (
      <G>
        <Path d={`M ${x} ${y} C ${x - 6 * s} ${y - 12 * s} ${x - 24 * s} ${y - 6 * s} ${x - 18 * s} ${y + 1 * s} C ${x - 24 * s} ${y + 8 * s} ${x - 6 * s} ${y + 7 * s} ${x} ${y}`} fill="#FF4F9A" />
        <Path d={`M ${x} ${y} C ${x + 6 * s} ${y - 12 * s} ${x + 24 * s} ${y - 6 * s} ${x + 18 * s} ${y + 1 * s} C ${x + 24 * s} ${y + 8 * s} ${x + 6 * s} ${y + 7 * s} ${x} ${y}`} fill="#FF8AC6" />
        <Path d={`M ${x - 2 * s} ${y + 2 * s} L ${x - 12 * s} ${y + 20 * s} L ${x - 4 * s} ${y + 16 * s} Z`} fill="#FF4F9A" />
        <Path d={`M ${x + 2 * s} ${y + 2 * s} L ${x + 12 * s} ${y + 20 * s} L ${x + 4 * s} ${y + 16 * s} Z`} fill="#FF77B5" />
        <Polygon points={`${x},${y - 5 * s} ${x + 1.6 * s},${y - 1.4 * s} ${x + 5 * s},${y} ${x + 1.6 * s},${y + 1.4 * s} ${x},${y + 5 * s} ${x - 1.6 * s},${y + 1.4 * s} ${x - 5 * s},${y} ${x - 1.6 * s},${y - 1.4 * s}`} fill="#FFE56A" stroke="#C4922A" strokeWidth={0.6} />
      </G>
    );
  }
  if (id === 'party-hat') {
    const x = hat.x;
    const y = hat.y;
    const tip = y + crown(anchors, 30) * s;
    const pom = y + crown(anchors, 34) * s;
    return (
      <G>
        <Ellipse cx={x} cy={y} rx={14 * s} ry={4.4 * s} fill="#E7B15A" />
        <Ellipse cx={x} cy={y - lift * s} rx={12 * s} ry={3.2 * s} fill="#F2C14E" />
        <Polygon points={`${x},${tip} ${x - 12 * s},${y} ${x + 12 * s},${y}`} fill="#FF8A5B" />
        <Polygon points={`${x},${tip} ${x - 12 * s},${y} ${x},${y}`} fill="#F07848" />
        <Path d={`M ${x - 8 * s} ${y + crown(anchors, 10) * s} L ${x + 8 * s} ${y + crown(anchors, 8) * s}`} stroke="#FFE56A" strokeWidth={2.6 * s} strokeLinecap="round" />
        <Path d={`M ${x - 5 * s} ${y + crown(anchors, 18) * s} L ${x + 5 * s} ${y + crown(anchors, 16) * s}`} stroke="#FFF6D8" strokeWidth={2.2 * s} strokeLinecap="round" />
        <Circle cx={x} cy={pom} r={3.8 * s} fill="#FFE56A" stroke="#E7B15A" strokeWidth={0.7} />
      </G>
    );
  }
  if (id === 'headphones') {
    const x = face.x;
    const y = face.y;
    const peakY = hat.y + crown(anchors, 6) * s;
    const cup = anchors.ears;
    const w = 12;
    const h = 16;
    return (
      <G>
        <Path d={`M ${x - cup} ${y - 1} Q ${hat.x} ${peakY} ${x + cup} ${y - 1}`} stroke="#2A2438" strokeWidth={3.6} fill="none" strokeLinecap="round" />
        <Rect x={x - cup - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill="#2A2438" />
        <Rect x={x - cup - w / 2 + 2} y={y - h / 2 + 3} width={7} height={10} rx={2} fill="#6A5A78" />
        <Rect x={x + cup - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill="#FF4FD8" />
        <Rect x={x + cup - w / 2 + 2} y={y - h / 2 + 3} width={7} height={10} rx={2} fill="#FFD0EA" />
      </G>
    );
  }
  if (id === 'scarf') {
    const x = neck.x;
    const y = neck.y;
    const hang = lift === 1 ? -1 : 1;
    return (
      <G>
        <Path
          d={`M ${x - 24 * s} ${y + 1 * s} Q ${x} ${y - 14 * s} ${x + 24 * s} ${y} Q ${x + 16 * s} ${y + 10 * s} ${x} ${y + 10 * s} Q ${x - 16 * s} ${y + 10 * s} ${x - 24 * s} ${y + 1 * s} Z`}
          fill="#A33A58"
        />
        <Path
          d={`M ${x - 20 * s} ${y} Q ${x} ${y - 10 * s} ${x + 20 * s} ${y - 1 * s} Q ${x + 12 * s} ${y + 7 * s} ${x} ${y + 7 * s} Q ${x - 12 * s} ${y + 7 * s} ${x - 20 * s} ${y} Z`}
          fill="#E45B7A"
        />
        {Array.from({ length: 8 }, (_, index) => {
          const t = (index + 0.5) / 8;
          const px = x + (-16 + t * 32) * s;
          return <Line key={index} x1={px} y1={y - 6 * s} x2={px} y2={y + 6 * s} stroke="#F7C2D0" strokeWidth={1.15 * s} />;
        })}
        <Path d={`M ${x - 4 * s} ${y + 6 * hang * s} L ${x - 22 * s} ${y + 28 * hang * s} L ${x - 14 * s} ${y + 30 * hang * s} L ${x} ${y + 8 * hang * s} Z`} fill="#E45B7A" />
        <Path d={`M ${x - 20 * s} ${y + 16 * hang * s} L ${x - 16 * s} ${y + 26 * hang * s}`} stroke="#F7C2D0" strokeWidth={1.1 * s} />
        <Path d={`M ${x + 4 * s} ${y + 5 * hang * s} L ${x + 20 * s} ${y + 26 * hang * s} L ${x + 28 * s} ${y + 24 * hang * s} L ${x + 8 * s} ${y + 5 * hang * s} Z`} fill="#C44768" />
        <Path d={`M ${x + 18 * s} ${y + 14 * hang * s} L ${x + 22 * s} ${y + 23 * hang * s}`} stroke="#F4A3B8" strokeWidth={1.1 * s} />
        <Circle cx={x + 2 * s} cy={y + 6 * hang * s} r={3.8 * s} fill="#D45374" stroke="#8E304C" strokeWidth={0.7} />
        {[0, 1, 2, 3, 4].map((index) => (
          <Line
            key={`left-${index}`}
            x1={x - 21 * s + index * 2.2 * s}
            y1={y + 28 * hang * s}
            x2={x - 22 * s + index * 2.3 * s}
            y2={y + 36 * hang * s}
            stroke="#F4A3B8"
            strokeWidth={1.35 * s}
            strokeLinecap="round"
          />
        ))}
        {[0, 1, 2, 3, 4].map((index) => (
          <Line
            key={`right-${index}`}
            x1={x + 18 * s + index * 2.2 * s}
            y1={y + 24 * hang * s}
            x2={x + 17 * s + index * 2.3 * s}
            y2={y + 32 * hang * s}
            stroke="#E7A0B4"
            strokeWidth={1.35 * s}
            strokeLinecap="round"
          />
        ))}
      </G>
    );
  }
  if (id === 'ribbon') {
    const x = neck.x;
    const y = neck.y;
    const hang = lift === 1 ? -1 : 1;
    return (
      <G>
        <Path d={`M ${x} ${y} C ${x - 4 * s} ${y - 8 * s} ${x - 20 * s} ${y - 4 * s} ${x - 16 * s} ${y + 2 * s} C ${x - 20 * s} ${y + 8 * s} ${x - 4 * s} ${y + 6 * s} ${x} ${y}`} fill="#F2A2B8" />
        <Path d={`M ${x} ${y} C ${x + 4 * s} ${y - 8 * s} ${x + 20 * s} ${y - 4 * s} ${x + 16 * s} ${y + 2 * s} C ${x + 20 * s} ${y + 8 * s} ${x + 4 * s} ${y + 6 * s} ${x} ${y}`} fill="#E45B86" />
        <Path d={`M ${x - 2 * s} ${y + 2 * hang * s} L ${x - 14 * s} ${y + 22 * hang * s} L ${x - 6 * s} ${y + 18 * hang * s} Z`} fill="#F7C2D2" />
        <Path d={`M ${x + 2 * s} ${y + 2 * hang * s} L ${x + 14 * s} ${y + 22 * hang * s} L ${x + 6 * s} ${y + 18 * hang * s} Z`} fill="#E45B86" />
        <Circle cx={x} cy={y + 1 * s} r={3.3 * s} fill="#F7C98A" stroke="#C4922A" strokeWidth={0.6} />
      </G>
    );
  }
  if (id === 'pearls') {
    const beads = 9;
    return (
      <G>
        {Array.from({ length: beads }, (_, index) => {
          const t = (index - (beads - 1) / 2) / ((beads - 1) / 2);
          const cx = neck.x + t * 20 * s;
          const cy = neck.y + t * t * 9 * s * (lift === 1 ? -1 : 1);
          const r = (index === 4 ? 3.8 : 3.15) * s;
          return (
            <G key={index}>
              <Circle cx={cx + 0.4 * s} cy={cy + 1.1 * s} r={r} fill="#D9CBB6" />
              <Circle cx={cx} cy={cy} r={r} fill="#F8F6F1" stroke="#B7A48C" strokeWidth={0.9} />
              <Circle cx={cx - r * 0.32} cy={cy - r * 0.34} r={r * 0.28} fill="#FFFFFF" />
            </G>
          );
        })}
        <Circle cx={neck.x} cy={neck.y - 1 * s} r={1.8 * s} fill="#E7C16A" stroke="#8A6420" strokeWidth={0.5} />
      </G>
    );
  }
  if (id === 'glasses') {
    const x = face.x;
    const y = face.y;
    const gap = 14 * s;
    const lens = 8.4 * s;
    const star = (cx: number, cy: number) =>
      `${cx},${cy - 2.4 * s} ${cx + 0.7 * s},${cy - 0.7 * s} ${cx + 2.4 * s},${cy} ${cx + 0.7 * s},${cy + 0.7 * s} ${cx},${cy + 2.4 * s} ${cx - 0.7 * s},${cy + 0.7 * s} ${cx - 2.4 * s},${cy} ${cx - 0.7 * s},${cy - 0.7 * s}`;
    return (
      <G>
        <Circle cx={x - gap} cy={y} r={lens} stroke="#1A1A40" strokeWidth={2 * s} fill="rgba(255,255,255,0.28)" />
        <Circle cx={x + gap} cy={y} r={lens} stroke="#1A1A40" strokeWidth={2 * s} fill="rgba(255,255,255,0.28)" />
        <Path d={`M ${x - gap + lens} ${y} H ${x + gap - lens}`} stroke="#1A1A40" strokeWidth={1.8 * s} />
        <Path d={`M ${x - gap - lens} ${y} L ${x - gap - lens - 8 * s} ${y - 3 * s}`} stroke="#1A1A40" strokeWidth={1.7 * s} strokeLinecap="round" />
        <Path d={`M ${x + gap + lens} ${y} L ${x + gap + lens + 8 * s} ${y - 3 * s}`} stroke="#1A1A40" strokeWidth={1.7 * s} strokeLinecap="round" />
        <Polygon points={star(x - gap, y)} fill="#FFE56A" />
        <Polygon points={star(x + gap, y)} fill="#FFE56A" />
      </G>
    );
  }
  if (id === 'crown-flower') {
    const x = hat.x;
    const y = hat.y;
    const side = y + crown(anchors, -1) * s;
    const peak = y + crown(anchors, 8) * s;
    return (
      <G>
        <Path d={`M ${x - 22 * s} ${side} Q ${x} ${peak} ${x + 22 * s} ${side}`} stroke="#3E7A3A" strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
        {flower(x - 16 * s, y + crown(anchors, 1) * s, '#F4A3B8', 5.4 * s)}
        {flower(x, peak, '#FF8A7A', 6.4 * s)}
        {flower(x + 16 * s, y + crown(anchors, 1) * s, '#C9B6F2', 5.4 * s)}
        <Ellipse cx={x - 8 * s} cy={side} rx={3 * s} ry={1.4 * s} fill="#6E9A55" />
        <Ellipse cx={x + 8 * s} cy={side} rx={3 * s} ry={1.4 * s} fill="#6E9A55" />
      </G>
    );
  }
  if (id === 'moon-pin') {
    const x = pin.x;
    const y = pin.y;
    return (
      <G>
        <Circle cx={x} cy={y} r={11 * s} fill="#2C2433" />
        <Path
          d={`M ${x + 2 * s} ${y - 7 * s} A ${7 * s} ${7 * s} 0 1 0 ${x + 2 * s} ${y + 7 * s} A ${4.6 * s} ${4.6 * s} 0 1 1 ${x + 2 * s} ${y - 7 * s}`}
          fill="#FFE56A"
          stroke="#FFF6D8"
          strokeWidth={0.7}
        />
        <Circle cx={x + 5 * s} cy={y - 4 * s} r={1.1 * s} fill="#FFFFFF" />
      </G>
    );
  }
  if (id === 'wand') {
    const x = pin.x + 8 * s;
    const y = pin.y;
    const tipX = x + 22 * s;
    const tipY = y - 10 * s;
    return (
      <G>
        <Line x1={x} y1={y + 8 * s} x2={tipX - 2 * s} y2={tipY + 4 * s} stroke="#C47B5A" strokeWidth={3.2 * s} strokeLinecap="round" />
        <Circle cx={x - 1 * s} cy={y + 10 * s} r={2.4 * s} fill="#E7C16A" />
        <Polygon
          points={`${tipX},${tipY - 12 * s} ${tipX + 2.2 * s},${tipY - 4 * s} ${tipX + 10 * s},${tipY - 4 * s} ${tipX + 3.6 * s},${tipY + 1 * s} ${tipX + 6 * s},${tipY + 9 * s} ${tipX},${tipY + 3.4 * s} ${tipX - 6 * s},${tipY + 9 * s} ${tipX - 3.6 * s},${tipY + 1 * s} ${tipX - 10 * s},${tipY - 4 * s} ${tipX - 2.2 * s},${tipY - 4 * s}`}
          fill="#FFE56A"
          stroke="#C4922A"
          strokeWidth={0.8}
        />
      </G>
    );
  }
  if (id === 'halo') {
    const cy = hat.y + crown(anchors, 16) * s;
    return (
      <G>
        <Ellipse cx={hat.x} cy={cy} rx={16 * s} ry={5.2 * s} stroke="#8A6420" strokeWidth={4.2 * s} fill="none" />
        <Ellipse cx={hat.x} cy={cy - lift * 0.6 * s} rx={16 * s} ry={5.2 * s} stroke="#F2C14E" strokeWidth={2.4 * s} fill="none" />
        <Ellipse cx={hat.x} cy={cy - lift * 1.4 * s} rx={9 * s} ry={2 * s} stroke="#FFF6D8" strokeWidth={1.2 * s} fill="none" />
      </G>
    );
  }
  return null;
}

function pencil(cx: number, cy: number, rx: number, ry: number, color: string) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} opacity={0.42} />;
}

function Mochi({ mood, writing, finished }: DrawProps) {
  const napping = mood === 'tired' && !writing && !finished;
  return (
    <G>
      <Ellipse cx={118} cy={128} rx={16} ry={10} fill="#F4A3B8" />
      <Ellipse cx={80} cy={124} rx={42} ry={32} fill="#F7C7B2" />
      {pencil(80, 136, 20, 10, '#E8A88E')}
      <Ellipse cx={80} cy={132} rx={22} ry={14} fill="#FFE4D4" />
      <Path d="M48 58 L40 22 L62 48 Z" fill="#F7C7B2" />
      <Path d="M112 58 L120 22 L98 48 Z" fill="#F7C7B2" />
      <Path d="M52 50 L46 30 L60 48 Z" fill="#FFD0DC" />
      <Path d="M108 50 L114 30 L100 48 Z" fill="#FFD0DC" />
      <Circle cx={80} cy={78} r={34} fill="#F7C7B2" />
      {napping ? (
        <G>
          <Path d="M64 76 Q70 80 76 76" stroke="#5C3A45" strokeWidth={2} fill="none" />
          <Path d="M84 76 Q90 80 96 76" stroke="#5C3A45" strokeWidth={2} fill="none" />
          <Path d="M74 90 Q80 94 86 90" stroke="#5C3A45" strokeWidth={1.6} fill="none" />
          <SvgText x={118} y={40} fill="#8A6570" fontSize={14}>z</SvgText>
          <SvgText x={128} y={28} fill="#C9A0B0" fontSize={11}>z</SvgText>
        </G>
      ) : (
        <Face cx={80} cy={80} mood={mood} />
      )}
    </G>
  );
}

function Batsy({ mood }: DrawProps) {
  return (
    <G>
      <Line x1={80} y1={4} x2={80} y2={28} stroke="#C9A24D" strokeWidth={2} />
      <Circle cx={80} cy={6} r={3} fill="#C9A24D" />
      <Path d="M62 36 Q80 28 98 36 L92 48 Q80 40 68 48 Z" fill="#2C2433" />
      <Path d="M28 78 C20 50 48 46 70 70 C60 48 40 58 28 78 Z" fill="#3A3148" />
      <Path d="M132 78 C140 50 112 46 90 70 C100 48 120 58 132 78 Z" fill="#3A3148" />
      <Ellipse cx={80} cy={86} rx={22} ry={26} fill="#2C2433" />
      <Circle cx={80} cy={112} r={20} fill="#3A3148" />
      {pencil(80, 122, 10, 6, '#241C2A')}
      <Path d="M68 122 L74 138 L80 124 Z" fill="#2C2433" />
      <Path d="M92 122 L86 138 L80 124 Z" fill="#2C2433" />
      <Face cx={80} cy={112} mood={mood} scale={0.85} />
      <Path d="M76 122 L80 128 L84 122" fill="#F4E7D4" />
    </G>
  );
}

function Sprout({ mood, streak }: DrawProps) {
  const blooms = sproutBlooms(streak);
  const colors = ['#F4A3B8', '#FF8A7A', '#C9B6F2', '#FFE56A', '#8FD0B8', '#F2A2B8'];
  return (
    <G>
      <Ellipse cx={80} cy={150} rx={36} ry={8} fill="#E7D7B8" />
      {Array.from({ length: blooms }, (_, index) => flower(28 + index * 20, 142 - (index % 2) * 8, colors[index] ?? '#F4A3B8', 6))}
      {blooms === 0 ? <Ellipse cx={80} cy={138} rx={6} ry={8} fill="#7E9A6A" /> : null}
      <Rect x={70} y={108} width={20} height={36} rx={8} fill="#F7F1E1" />
      <Ellipse cx={80} cy={100} rx={40} ry={26} fill="#E36B6B" />
      {pencil(80, 112, 16, 8, '#C45A5A')}
      <Circle cx={58} cy={92} r={5} fill="#F7E2C8" />
      <Circle cx={78} cy={84} r={4} fill="#F7E2C8" />
      <Circle cx={100} cy={94} r={4.5} fill="#F7E2C8" />
      <Face cx={80} cy={104} mood={mood} scale={0.8} />
    </G>
  );
}

function Glitter({ mood, finished, celebrate }: DrawProps) {
  const cheer = finished || celebrate;
  return (
    <G>
      <Ellipse cx={48} cy={34} rx={9} ry={22} fill="#FFF6F8" />
      <Ellipse cx={112} cy={34} rx={9} ry={22} fill="#FFF6F8" />
      <Ellipse cx={48} cy={36} rx={4} ry={12} fill="#FFD0E4" />
      <Ellipse cx={112} cy={36} rx={4} ry={12} fill="#FFD0E4" />
      <Ellipse cx={108} cy={58} rx={10} ry={7} fill="#FF4F9A" transform="rotate(20 108 58)" />
      <Ellipse cx={92} cy={60} rx={8} ry={6} fill="#FF8AC6" transform="rotate(-20 92 60)" />
      <Circle cx={98} cy={60} r={4} fill="#FFE56A" />
      <Circle cx={80} cy={86} r={32} fill="#FFF6F8" />
      <Ellipse cx={80} cy={128} rx={26} ry={20} fill="#FFE4F2" />
      {cheer ? (
        <G>
          <Ellipse cx={42} cy={70} rx={8} ry={14} fill="#FFF6F8" transform="rotate(-40 42 70)" />
          <Ellipse cx={118} cy={70} rx={8} ry={14} fill="#FFF6F8" transform="rotate(40 118 70)" />
          <Path d="M24 40 L28 48 M22 48 L30 46" stroke="#FFE56A" strokeWidth={2} />
          <Path d="M132 48 L140 42 M136 54 L146 52" stroke="#FF8AD4" strokeWidth={2} />
        </G>
      ) : (
        <G>
          <Ellipse cx={46} cy={120} rx={8} ry={12} fill="#FFF6F8" />
          <Ellipse cx={114} cy={120} rx={8} ry={12} fill="#FFF6F8" />
        </G>
      )}
      <Face cx={80} cy={88} mood={cheer ? 'excited' : mood} />
    </G>
  );
}

function Prism({ mood }: DrawProps) {
  const color = getMood(mood).color;
  return (
    <G>
      <Ellipse cx={36} cy={112} rx={14} ry={8} fill={color} />
      <Path d="M30 104 Q14 96 20 84" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Ellipse cx={92} cy={108} rx={36} ry={24} fill={color} />
      <Ellipse cx={92} cy={116} rx={20} ry={10} fill="#fff" opacity={0.35} />
      <Circle cx={118} cy={96} r={18} fill={color} />
      {['#FF6B6B', '#FFE56A', '#7DCE82', '#8ECAE6', '#C9B6F2'].map((gill, index) => (
        <Path
          key={gill}
          d={`M ${124} ${88 + index * 5} Q ${146} ${84 + index * 6} ${138} ${100 + index * 3}`}
          stroke={gill}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <Face cx={118} cy={96} mood={mood} scale={0.75} />
    </G>
  );
}

function doodle(mood: MoodId) {
  if (mood === 'sad') {
    return (
      <G>
        <Path d="M118 48 q16 -16 32 0 q-6 10 -16 8 q-10 2 -16 -8" fill="#9BB0E8" opacity={0.9} />
        <Path d="M126 58 v8 M134 56 v12 M142 58 v8" stroke="#7A8CFF" strokeWidth={2} strokeLinecap="round" />
        <Path d="M48 132 Q80 118 112 132" stroke="#C9D4F2" strokeWidth={8} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (mood === 'anxious') return <Path d="M124 80 q6 -8 12 0 t12 0" stroke="#C9A0DC" strokeWidth={2} fill="none" />;
  if (mood === 'tired') return <SvgText x={126} y={70} fontSize={16} fill="#9AA0B4">z z</SvgText>;
  if (mood === 'angry') return <Path d="M126 70 l8 10 l8 -10 l8 10" stroke="#E85D4C" strokeWidth={2} fill="none" />;
  if (mood === 'hopeful') return flower(136, 70, '#7DCE82', 6);
  if (mood === 'fired') return <Path d="M132 88 C128 70 140 68 136 52 C142 68 152 70 144 88 C148 78 140 92 132 88 Z" fill="#FF5A36" />;
  if (mood === 'happy' || mood === 'excited') {
    return (
      <G>
        <Polygon points="30,48 32,54 38,54 33,58 35,64 30,60 25,64 27,58 22,54 28,54" fill="#F6C445" />
        <Polygon points="132,40 134,46 140,46 135,50 137,56 132,52 127,56 129,50 124,46 130,46" fill="#F6C445" />
      </G>
    );
  }
  if (mood === 'loved' || mood === 'grateful') {
    return (
      <G>
        <Path d="M128 78 C120 66 138 66 128 88 C138 66 146 72 128 88" fill="#FF6B9A" />
        <Path d="M36 70 C30 62 42 62 36 76 C42 62 48 66 36 76" fill="#F4A4B8" />
      </G>
    );
  }
  if (mood === 'calm') return <Ellipse cx={136} cy={64} rx={10} ry={6} fill="#8ECAE6" opacity={0.7} />;
  return <Polygon points="136,64 140,74 150,74 142,80 146,90 136,84 126,90 130,80 122,74 132,74" fill="#F2C14E" />;
}

const SIGNATURES: Record<string, ReactNode> = {
  mochi: <Circle cx={108} cy={128} r={5} fill="#F4A3B8" />,
  batsy: <Path d="M108 40 l4 8 l8 1 l-6 5 l2 8 l-8 -4 l-8 4 l2 -8 l-6 -5 l8 -1 z" fill="#C9A24D" />,
  sprout: <Ellipse cx={112} cy={48} rx={6} ry={3} fill="#7DCE82" />,
  glitter: <Polygon points="118,36 120,42 126,42 121,46 123,52 118,48 113,52 115,46 110,42 116,42" fill="#F6C445" />,
  prism: <Polygon points="116,50 122,62 110,62" fill="#8ECAE6" />,
  inky: <Circle cx={118} cy={140} r={4} fill="#3A2A32" />,
  pip: <Circle cx={48} cy={120} r={5} fill="#F6C445" />,
  nova: <Circle cx={120} cy={40} r={4} fill="#F2C14E" />,
  shelly: <Ellipse cx={40} cy={120} rx={8} ry={4} fill="#E7C99A" />,
  ghosty: <Circle cx={112} cy={48} r={4} fill="#F4F1EA" />,
  ember: <Path d="M118 50 C116 40 124 40 120 30 C124 40 130 42 124 52 Z" fill="#FF5A36" />,
  lumi: <Circle cx={120} cy={46} r={4} fill="#FFF6D0" />,
};

function Inky({ mood }: DrawProps) {
  return (
    <G>
      <Path d="M48 70 C40 40 120 36 118 74 C140 80 130 120 100 124 C70 140 36 120 40 96 C28 90 32 74 48 70 Z" fill="#2C3A68" />
      <Path d="M70 124 C74 142 86 140 84 124" fill="#243156" />
      <Circle cx={96} cy={118} r={5} fill="#1B2748" />
      <Rect x={108} y={96} width={18} height={5} rx={2} fill="#F2C14E" transform="rotate(28 116 98)" />
      <Polygon points="126,92 132,100 120,98" fill="#F4E7D4" />
      <Face cx={78} cy={86} mood={mood} scale={0.9} />
      {doodle(mood)}
    </G>
  );
}

function Pip({ mood, prompt }: DrawProps) {
  const snippet = (prompt ?? 'today’s prompt').slice(0, 28);
  return (
    <G>
      <Ellipse cx={70} cy={118} rx={28} ry={22} fill="#FFE56A" />
      {pencil(70, 128, 14, 8, '#F2C14E')}
      <Circle cx={74} cy={78} r={30} fill="#FFE56A" />
      <Ellipse cx={46} cy={100} rx={10} ry={7} fill="#F2C14E" />
      <Polygon points="86,84 108,92 86,98" fill="#FF8A5B" />
      <Ellipse cx={60} cy={146} rx={8} ry={4} fill="#FF8A5B" />
      <Ellipse cx={84} cy={146} rx={8} ry={4} fill="#FF8A5B" />
      <Rect x={104} y={70} width={46} height={32} rx={4} fill="#FFFDF8" stroke="#E7D3B0" strokeWidth={1.5} />
      <SvgText x={108} y={84} fontSize={6} fill="#6A5438">
        {snippet.slice(0, 14)}
      </SvgText>
      <SvgText x={108} y={94} fontSize={6} fill="#6A5438">
        {snippet.slice(14, 28)}
      </SvgText>
      <Face cx={70} cy={78} mood={mood} looking={3} scale={0.9} />
    </G>
  );
}

function Nova({ mood, streak, writing }: DrawProps) {
  const glow = novaGlow(streak);
  const sleepy = streak < 2 && !writing;
  return (
    <G>
      <Circle cx={80} cy={88} r={48 + glow * 10} fill="#F2C14E" opacity={0.18 + glow * 0.35} />
      <Polygon points="80,28 96,70 142,74 106,100 118,144 80,116 42,144 54,100 18,74 64,70" fill="#F6C445" />
      <Polygon points="80,48 90,74 118,76 96,92 104,118 80,102 56,118 64,92 42,76 70,74" fill="#FFE9A0" />
      <Face cx={80} cy={90} mood={mood} sleepy={sleepy} scale={0.9} />
    </G>
  );
}

function Shelly({ mood }: DrawProps) {
  return (
    <G>
      <Path d="M36 78 Q36 36 80 36 Q124 36 124 78 Z" fill="#C9B6F2" opacity={0.85} />
      {pencil(80, 70, 22, 8, '#B7A0E8')}
      <Ellipse cx={80} cy={78} rx={44} ry={10} fill="#E6DCFF" />
      <Path d="M52 80 Q48 112 44 128" stroke="#B7A0E8" strokeWidth={3} fill="none" />
      <Path d="M68 82 Q72 120 60 136" stroke="#8ECAE6" strokeWidth={3} fill="none" />
      <Path d="M92 82 Q88 118 100 134" stroke="#F4A3B8" strokeWidth={3} fill="none" />
      <Path d="M108 80 Q116 110 112 126" stroke="#C9B6F2" strokeWidth={3} fill="none" />
      <Circle cx={148} cy={48} r={4} fill="#fff" opacity={0.7} />
      <Circle cx={24} cy={60} r={3} fill="#fff" opacity={0.6} />
      <Face cx={80} cy={66} mood={mood} scale={0.85} />
    </G>
  );
}

function Ghosty({ mood, entryCount }: DrawProps) {
  const shy = entryCount < 3;
  const waving = entryCount >= 8;
  return (
    <G opacity={ghostyOpacity(entryCount)}>
      <Path d="M40 150 C40 70 120 64 120 150 L110 138 L96 154 L80 136 L64 154 L50 138 Z" fill="#F7F4FA" stroke="#E4D8EE" strokeWidth={2} />
      {pencil(80, 118, 16, 8, '#E4D8EE')}
      {waving ? <Ellipse cx={126} cy={110} rx={10} ry={7} fill="#F7F4FA" transform="rotate(-30 126 110)" /> : null}
      <Face cx={80} cy={104} mood={shy ? 'calm' : mood} looking={shy ? -6 : 0} scale={0.95} />
    </G>
  );
}

function Ember({ mood, streak }: DrawProps) {
  return (
    <G>
      <Path d="M118 132 Q146 120 132 100 Q150 108 140 86" stroke="#7E9A6A" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Polygon points="140,82 150,96 132,94" fill="#E36B6B" />
      <Ellipse cx={78} cy={118} rx={36} ry={28} fill="#7E9A6A" />
      <Ellipse cx={78} cy={126} rx={18} ry={12} fill="#F2C14E" />
      <Path d="M40 100 Q18 78 36 70 Q28 96 52 104 Z" fill="#5E7A48" />
      <Path d="M112 96 Q140 74 124 64 Q132 96 100 108 Z" fill="#5E7A48" />
      <Circle cx={78} cy={74} r={26} fill="#8EAE78" />
      <Path d="M64 58 L60 36 L74 54 Z" fill="#F2C14E" />
      <Path d="M92 58 L98 34 L86 54 Z" fill="#E7C16A" />
      <Face cx={78} cy={76} mood={mood} scale={0.85} />
      {streak >= 3 || mood === 'excited' ? <Path d="M96 70 C102 60 110 66 102 76 C108 68 112 76 100 80 Z" fill="#FF8A5B" /> : null}
    </G>
  );
}

function Lumi({ mood }: DrawProps) {
  return (
    <G>
      <Path d="M40 130 Q24 150 48 146 Q40 136 56 128" fill="#F4A3B8" />
      <Path d="M46 128 Q30 146 52 142" fill="#C9B6F2" />
      <Ellipse cx={78} cy={124} rx={34} ry={24} fill="#FFF8FC" />
      <Path d="M96 108 Q130 96 124 78 Q108 92 100 108 Z" fill="#FFE4F2" />
      <Circle cx={104} cy={72} r={24} fill="#FFFDF8" />
      {pencil(104, 82, 10, 6, '#F4D5E4')}
      <Path d="M96 40 Q104 18 112 42 Q104 34 96 40 Z" fill="#F2C14E" />
      <Path d="M100 36 Q104 22 108 36" stroke="#E7B15A" strokeWidth={2} fill="none" />
      <Path d="M84 60 Q70 48 78 70" fill="#FF8FB8" />
      <Path d="M96 52 Q112 40 118 64" fill="#C9B6F2" />
      <Path d="M108 58 Q126 52 124 74" fill="#8ECAE6" />
      <Ellipse cx={58} cy={146} rx={8} ry={4} fill="#F2C14E" />
      <Ellipse cx={92} cy={148} rx={8} ry={4} fill="#F2C14E" />
      <Face cx={106} cy={74} mood={mood} scale={0.8} />
    </G>
  );
}

export const BUDDY_DRAW: Record<string, (props: DrawProps) => ReactNode> = {
  mochi: Mochi,
  batsy: Batsy,
  sprout: Sprout,
  glitter: Glitter,
  prism: Prism,
  inky: Inky,
  pip: Pip,
  nova: Nova,
  shelly: Shelly,
  ghosty: Ghosty,
  ember: Ember,
  lumi: Lumi,
};

export function BuddyView({
  buddyId,
  size = 140,
  showLine = false,
  outfits,
  layout = 'stack',
  taps = false,
  onPress,
  wander = false,
  still = false,
  ...ctx
}: BuddyContext & {
  buddyId: string;
  size?: number;
  showLine?: boolean;
  outfits: string[];
  layout?: 'stack' | 'row';
  taps?: boolean;
  onPress?: () => void;
  wander?: boolean;
  still?: boolean;
}) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const buddy = getBuddy(buddyId);
  const bob = useRef(new Animated.Value(0)).current;
  const arrive = useRef(new Animated.Value(still ? 1 : 0.86)).current;
  const bounce = useRef(new Animated.Value(still ? 2 : 0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const squish = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);
  const reaction = `${ctx.mood}|${ctx.celebrate ? 1 : 0}|${ctx.writing ? 1 : 0}|${ctx.finished ? 1 : 0}|${ctx.streak}`;
  const skipReaction = useRef(true);
  const lastMood = useRef(ctx.mood);

  useEffect(() => {
    if (reduceMotion || still) return;
    const duration = buddyId === 'shelly' ? 2800 : 1500;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, buddyId, reduceMotion, still]);

  useEffect(() => {
    if (reduceMotion || still) {
      arrive.setValue(1);
      bounce.setValue(2);
      return;
    }
    Animated.spring(arrive, { toValue: 1, friction: 5, tension: 80, useNativeDriver: false }).start();
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.spring(bounce, { toValue: 2, friction: 6, tension: 160, useNativeDriver: false }),
    ]).start();
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breath, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    breathe.start();
    let timer: ReturnType<typeof setTimeout>;
    const wink = () => {
      setBlink(true);
      timer = setTimeout(() => {
        setBlink(false);
        timer = setTimeout(wink, 2600);
      }, 140);
    };
    timer = setTimeout(wink, 1200);
    return () => {
      breathe.stop();
      clearTimeout(timer);
    };
  }, [arrive, bounce, breath, reduceMotion, still]);

  function squishTap() {
    playBuddySound(buddyId);
    onPress?.();
    if (reduceMotion) return;
    squish.setValue(0);
    Animated.sequence([
      Animated.timing(squish, { toValue: 1, duration: 90, useNativeDriver: false }),
      Animated.timing(squish, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();
  }

  useEffect(() => {
    if (skipReaction.current) {
      skipReaction.current = false;
      lastMood.current = ctx.mood;
      return;
    }
    if (lastMood.current !== ctx.mood) {
      lastMood.current = ctx.mood;
      return;
    }
    playBuddySound(buddyId);
  }, [reaction, buddyId, ctx.mood]);

  if (!buddy) return null;
  const Draw = BUDDY_DRAW[buddy.id];
  const line = showLine ? buddyLine(buddy, ctx) : '';
  const drawProps: DrawProps = { ...ctx, anchors: buddy.anchors, outfits };
  const drift = wander ? [-22, 22] : buddy.id === 'shelly' ? [-18, 18] : [0, 0];
  const bobTransform =
    buddy.id === 'batsy'
      ? [{ rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }]
      : buddy.id === 'shelly' || wander
        ? [{ translateX: bob.interpolate({ inputRange: [0, 1], outputRange: drift as [number, number] }) }]
        : [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, buddy.id === 'ghosty' ? -3 : -7] }) }];
  const scale = Animated.multiply(arrive, breath.interpolate({ inputRange: [0, 1], outputRange: [1, reduceMotion ? 1 : 1.035] }));
  const stretchX = bounce.interpolate({ inputRange: [0, 1, 2], outputRange: [1.16, 0.9, 1], extrapolate: 'clamp' });
  const stretchY = bounce.interpolate({ inputRange: [0, 1, 2], outputRange: [0.82, 1.14, 1], extrapolate: 'clamp' });
  const scaleX = Animated.multiply(Animated.multiply(scale, stretchX), squish.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }));
  const scaleY = Animated.multiply(Animated.multiply(scale, stretchY), squish.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] }));
  const ink = theme.colors.ink;

  const art = (
    <MotionCtx.Provider value={{ blink }}>
      <Animated.View style={{ transform: [{ scaleX }, { scaleY }] }}>
        <Animated.View style={{ transform: bobTransform }}>
          <Svg width={size} height={size * (170 / 160)} viewBox="0 0 160 170">
            <Ellipse cx={80} cy={160} rx={42} ry={8} fill={ink} opacity={0.08} />
            <Ellipse cx={80} cy={158} rx={28} ry={4.5} fill={ink} opacity={0.12} />
            <Outfits ids={outfits} anchors={buddy.anchors} behind />
            {Draw ? <Draw {...drawProps} /> : <Circle cx={80} cy={90} r={30} fill={theme.colors.accent} />}
            {SIGNATURES[buddy.id] ?? null}
            <Outfits ids={outfits} anchors={buddy.anchors} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </MotionCtx.Provider>
  );

  return (
    <View style={[styles.wrap, layout === 'row' && styles.row]} pointerEvents={taps ? 'box-none' : 'none'}>
      {line ? (
        <View style={[styles.bubble, { backgroundColor: theme.colors.paper, borderColor: theme.colors.paperEdge }]}>
          <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 16, lineHeight: 18 }}>{line}</Text>
        </View>
      ) : null}
      {taps ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${buddy.name}, play sound`}
          onPress={squishTap}
        >
          {art}
        </Pressable>
      ) : (
        art
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', maxWidth: 240, overflow: 'visible' },
  row: { flexDirection: 'row', alignItems: 'center', maxWidth: 360, gap: 8 },
  bubble: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 190,
  },
});
