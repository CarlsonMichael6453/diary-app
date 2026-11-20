import { useEffect, useRef, type ReactNode } from 'react';
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
  const gap = 12 * scale;
  const y = cy - 1 * scale;
  const lx = cx - gap + looking;
  const rx = cx + gap + looking;
  const ink = '#3A2A32';
  const blush = mood === 'angry' ? '#E07A72' : '#F4A4B8';
  const showBlush = mood === 'happy' || mood === 'loved' || mood === 'grateful' || mood === 'hopeful' || mood === 'calm';
  const eye =
    sleepy || mood === 'tired' ? (
      <G>
        <Path d={`M ${lx - 5} ${y} Q ${lx} ${y + 4} ${lx + 5} ${y}`} stroke={ink} strokeWidth={2} fill="none" />
        <Path d={`M ${rx - 5} ${y} Q ${rx} ${y + 4} ${rx + 5} ${y}`} stroke={ink} strokeWidth={2} fill="none" />
      </G>
    ) : mood === 'grateful' ? (
      <G>
        <Path d={`M ${lx - 5} ${y + 1} Q ${lx} ${y - 4} ${lx + 5} ${y + 1}`} stroke={ink} strokeWidth={2} fill="none" />
        <Path d={`M ${rx - 5} ${y + 1} Q ${rx} ${y - 4} ${rx + 5} ${y + 1}`} stroke={ink} strokeWidth={2} fill="none" />
      </G>
    ) : mood === 'loved' ? (
      <G>
        <Path d={`M ${lx} ${y + 3} C ${lx - 5} ${y - 3} ${lx - 2} ${y - 4} ${lx} ${y} C ${lx + 2} ${y - 4} ${lx + 5} ${y - 3} ${lx} ${y + 3}`} fill="#E85D78" />
        <Path d={`M ${rx} ${y + 3} C ${rx - 5} ${y - 3} ${rx - 2} ${y - 4} ${rx} ${y} C ${rx + 2} ${y - 4} ${rx + 5} ${y - 3} ${rx} ${y + 3}`} fill="#E85D78" />
      </G>
    ) : (
      <G>
        <Circle cx={lx} cy={y} r={mood === 'excited' || mood === 'anxious' ? 3.4 * scale : 2.6 * scale} fill={ink} />
        <Circle cx={rx} cy={y} r={mood === 'excited' || mood === 'anxious' ? 3.4 * scale : 2.6 * scale} fill={ink} />
        <Circle cx={lx + 1} cy={y - 1} r={0.8} fill="#fff" />
        <Circle cx={rx + 1} cy={y - 1} r={0.8} fill="#fff" />
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
          : `M ${cx - 7} ${mouthY - 1} Q ${cx} ${mouthY + (mood === 'excited' ? 8 : 5)} ${cx + 7} ${mouthY - 1}`
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
      {showBlush ? (
        <G>
          <Ellipse cx={lx - 2} cy={y + 7} rx={4} ry={2} fill={blush} opacity={0.85} />
          <Ellipse cx={rx + 2} cy={y + 7} rx={4} ry={2} fill={blush} opacity={0.85} />
        </G>
      ) : null}
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
  const back = new Set(['cape']);
  const list = ids.filter((id) => (behind ? back.has(id) : !back.has(id)));
  return (
    <G>
      {list.map((id) => (
        <G key={id}>{drawOutfit(id, anchors)}</G>
      ))}
    </G>
  );
}

function drawOutfit(id: string, anchors: BuddyDef['anchors']) {
  const hat = anchors.hat;
  const neck = anchors.neck;
  const face = anchors.face;
  const pin = anchors.pin;
  if (id === 'cape') {
    return <Path d={`M ${neck.x - 26} ${neck.y - 6} Q ${neck.x} ${neck.y + 46} ${neck.x + 26} ${neck.y - 6} L ${neck.x + 16} ${neck.y + 28} L ${neck.x - 16} ${neck.y + 28} Z`} fill="#7C3A55" />;
  }
  if (id === 'bow') {
    return (
      <G>
        <Ellipse cx={hat.x - 10} cy={hat.y} rx={9} ry={6} fill="#FF4F9A" transform={`rotate(-18 ${hat.x - 10} ${hat.y})`} />
        <Ellipse cx={hat.x + 10} cy={hat.y} rx={9} ry={6} fill="#FF4F9A" transform={`rotate(18 ${hat.x + 10} ${hat.y})`} />
        <Circle cx={hat.x} cy={hat.y} r={4} fill="#FFE56A" />
      </G>
    );
  }
  if (id === 'party-hat') {
    return (
      <G>
        <Polygon points={`${hat.x},${hat.y - 26} ${hat.x - 12},${hat.y + 2} ${hat.x + 12},${hat.y + 2}`} fill="#FF8A5B" />
        <Circle cx={hat.x} cy={hat.y - 28} r={3.5} fill="#FFE56A" />
      </G>
    );
  }
  if (id === 'headphones') {
    return (
      <G>
        <Path d={`M ${hat.x - 18} ${hat.y + 4} Q ${hat.x} ${hat.y - 20} ${hat.x + 18} ${hat.y + 4}`} stroke="#3A3148" strokeWidth={3} fill="none" />
        <Rect x={hat.x - 22} y={hat.y} width={8} height={12} rx={3} fill="#3A3148" />
        <Rect x={hat.x + 14} y={hat.y} width={8} height={12} rx={3} fill="#FF4FD8" />
      </G>
    );
  }
  if (id === 'scarf') {
    return (
      <G>
        <Path d={`M ${neck.x - 22} ${neck.y} Q ${neck.x} ${neck.y + 10} ${neck.x + 22} ${neck.y}`} stroke="#E36B8A" strokeWidth={8} fill="none" strokeLinecap="round" />
        <Path d={`M ${neck.x + 10} ${neck.y} L ${neck.x + 16} ${neck.y + 22}`} stroke="#C47B5A" strokeWidth={6} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (id === 'ribbon') {
    return (
      <G>
        <Path d={`M ${neck.x - 8} ${neck.y} L ${neck.x - 18} ${neck.y + 18} L ${neck.x - 2} ${neck.y + 8} Z`} fill="#F2A2B8" />
        <Path d={`M ${neck.x + 8} ${neck.y} L ${neck.x + 18} ${neck.y + 18} L ${neck.x + 2} ${neck.y + 8} Z`} fill="#E45B86" />
        <Circle cx={neck.x} cy={neck.y} r={3.5} fill="#F7C98A" />
      </G>
    );
  }
  if (id === 'pearls') {
    return (
      <G>
        {[-14, -7, 0, 7, 14].map((offset) => (
          <Circle key={offset} cx={neck.x + offset} cy={neck.y + Math.abs(offset) * 0.15} r={3} fill="#F7F4EE" stroke="#E2D3C0" strokeWidth={0.6} />
        ))}
      </G>
    );
  }
  if (id === 'glasses') {
    return (
      <G>
        <Circle cx={face.x - 11} cy={face.y} r={8} stroke="#1A1A40" strokeWidth={2} fill="rgba(255,255,255,0.15)" />
        <Circle cx={face.x + 11} cy={face.y} r={8} stroke="#1A1A40" strokeWidth={2} fill="rgba(255,255,255,0.15)" />
        <Line x1={face.x - 3} y1={face.y} x2={face.x + 3} y2={face.y} stroke="#1A1A40" strokeWidth={2} />
        <Circle cx={face.x - 12} cy={face.y - 2} r={1.4} fill="#FFE56A" />
      </G>
    );
  }
  if (id === 'crown-flower') {
    return (
      <G>
        {flower(hat.x - 14, hat.y + 2, '#F4A3B8', 5)}
        {flower(hat.x, hat.y - 4, '#FF8A7A', 6)}
        {flower(hat.x + 14, hat.y + 2, '#C9B6F2', 5)}
      </G>
    );
  }
  if (id === 'moon-pin') {
    return (
      <G>
        <Circle cx={pin.x} cy={pin.y} r={7} fill="#F2C14E" />
        <Circle cx={pin.x + 3} cy={pin.y - 2} r={5.5} fill="#FFF8E8" />
      </G>
    );
  }
  if (id === 'wand') {
    return (
      <G>
        <Line x1={pin.x - 8} y1={pin.y + 12} x2={pin.x + 6} y2={pin.y - 10} stroke="#C47B5A" strokeWidth={3} strokeLinecap="round" />
        <Polygon points={`${pin.x + 6},${pin.y - 18} ${pin.x + 2},${pin.y - 8} ${pin.x + 12},${pin.y - 10} ${pin.x + 4},${pin.y - 4} ${pin.x + 10},${pin.y + 2}`} fill="#FFE56A" />
      </G>
    );
  }
  if (id === 'halo') {
    return <Ellipse cx={hat.x} cy={hat.y - 16} rx={16} ry={5} stroke="#F2C14E" strokeWidth={3} fill="none" />;
  }
  return null;
}

function Mochi({ mood, writing, finished }: DrawProps) {
  const napping = !writing && !finished;
  return (
    <G>
      <Ellipse cx={118} cy={128} rx={16} ry={10} fill="#F4A3B8" />
      <Ellipse cx={80} cy={124} rx={42} ry={32} fill="#F7C7B2" />
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
  if (mood === 'sad') return <Path d="M128 70 v10 M136 66 v16 M144 72 v8" stroke="#7A8CFF" strokeWidth={2} strokeLinecap="round" />;
  if (mood === 'anxious') return <Path d="M124 80 q6 -8 12 0 t12 0" stroke="#C9A0DC" strokeWidth={2} fill="none" />;
  if (mood === 'tired') return <SvgText x={126} y={78} fontSize={14} fill="#9AA0B4">z</SvgText>;
  if (mood === 'angry') return <Path d="M126 70 l8 10 l8 -10 l8 10" stroke="#E85D4C" strokeWidth={2} fill="none" />;
  if (mood === 'hopeful') return flower(136, 78, '#7DCE82', 5);
  if (mood === 'loved' || mood === 'grateful' || mood === 'happy') {
    return <Path d="M136 86 C128 74 146 74 136 96 C146 74 154 80 136 96" fill="#FF6B9A" />;
  }
  return <Polygon points="136,64 140,74 150,74 142,80 146,90 136,84 126,90 130,80 122,74 132,74" fill="#F2C14E" />;
}

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
  ...ctx
}: BuddyContext & {
  buddyId: string;
  size?: number;
  showLine?: boolean;
  outfits: string[];
  layout?: 'stack' | 'row';
  taps?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const buddy = getBuddy(buddyId);
  const bob = useRef(new Animated.Value(0)).current;
  const reaction = `${ctx.mood}|${ctx.celebrate ? 1 : 0}|${ctx.writing ? 1 : 0}|${ctx.finished ? 1 : 0}|${ctx.streak}`;
  const skipReaction = useRef(true);
  const lastMood = useRef(ctx.mood);

  useEffect(() => {
    if (reduceMotion) return;
    const duration = buddyId === 'shelly' ? 2800 : 1500;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, buddyId, reduceMotion]);

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
  const transform =
    buddy.id === 'batsy'
      ? [{ rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }]
      : buddy.id === 'shelly'
        ? [{ translateX: bob.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }]
        : [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, buddy.id === 'ghosty' ? -3 : -7] }) }];

  const art = (
    <Animated.View style={{ transform }}>
      <Svg width={size} height={size * (170 / 160)} viewBox="0 0 160 170">
        <Outfits ids={outfits} anchors={buddy.anchors} behind />
        {Draw ? <Draw {...drawProps} /> : <Circle cx={80} cy={90} r={30} fill={theme.colors.accent} />}
        <Outfits ids={outfits} anchors={buddy.anchors} />
      </Svg>
    </Animated.View>
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
          onPress={() => {
            playBuddySound(buddy.id);
            onPress?.();
          }}
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
  wrap: { alignItems: 'center', maxWidth: 220 },
  row: { flexDirection: 'row', alignItems: 'center', maxWidth: 360, gap: 8 },
  bubble: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 190,
  },
});
