import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const OUTLINE = 'M40 6 C58 4 74 18 72 34 C82 42 74 58 60 64 C64 78 48 86 34 80 C18 86 6 74 12 60 C2 50 8 34 22 30 C16 14 26 4 40 6 Z';

type PlushLook = {
  fill: string;
  shade: string;
  eye: string;
  extra?: ReactNode;
};

function body(fill: string, shade: string) {
  return (
    <G>
      <Ellipse cx={40} cy={78} rx={18} ry={4} fill="#000" opacity={0.12} />
      <Ellipse cx={40} cy={58} rx={20} ry={15} fill={fill} />
      <Ellipse cx={40} cy={62} rx={11} ry={8} fill={shade} opacity={0.55} />
      <Ellipse cx={18} cy={56} rx={7} ry={5} fill={fill} />
      <Ellipse cx={62} cy={56} rx={7} ry={5} fill={fill} />
      <Ellipse cx={30} cy={72} rx={7} ry={4.5} fill={fill} />
      <Ellipse cx={50} cy={72} rx={7} ry={4.5} fill={fill} />
      <Circle cx={40} cy={34} r={18} fill={fill} />
      <Path d="M40 20 V48 M28 36 H52" stroke={shade} strokeWidth={1} opacity={0.7} fill="none" strokeDasharray="2 2" />
    </G>
  );
}

function face(eye: string) {
  return (
    <G>
      <Ellipse cx={31} cy={40} rx={3.4} ry={1.8} fill="#F4A4B8" opacity={0.85} />
      <Ellipse cx={49} cy={40} rx={3.4} ry={1.8} fill="#F4A4B8" opacity={0.85} />
      <Circle cx={33} cy={34} r={5.4} fill={eye} />
      <Circle cx={47} cy={34} r={5.4} fill={eye} />
      <Circle cx={31.4} cy={32.4} r={1.7} fill="#fff" />
      <Circle cx={45.4} cy={32.4} r={1.7} fill="#fff" />
      <Path d="M35.2 31.2 l1.1 1.5 M49.2 31.2 l1.1 1.5" stroke="#fff" strokeWidth={0.8} />
      <Path d="M36 44 Q40 47 44 44" stroke={eye} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </G>
  );
}

const LOOKS: Record<string, PlushLook> = {
  mochi: {
    fill: '#F7C7B2',
    shade: '#E8A88E',
    eye: '#5C3A45',
    extra: (
      <G>
        <Path d="M24 24 L18 8 L32 20 Z" fill="#F7C7B2" />
        <Path d="M56 24 L62 8 L48 20 Z" fill="#F7C7B2" />
        <Path d="M26 22 L22 12 L32 20 Z" fill="#FFD0DC" />
        <Path d="M54 22 L58 12 L48 20 Z" fill="#FFD0DC" />
        <Circle cx={40} cy={50} r={3.2} fill="#F4A3B8" />
        <Path d="M40 53 v4" stroke="#C47B5A" strokeWidth={1} />
      </G>
    ),
  },
  batsy: {
    fill: '#3A3148',
    shade: '#241C2A',
    eye: '#F6C445',
    extra: (
      <G>
        <Path d="M22 36 C8 22 6 40 16 48 C12 36 18 32 22 36 Z" fill="#2C2433" />
        <Path d="M58 36 C72 22 74 40 64 48 C68 36 62 32 58 36 Z" fill="#2C2433" />
        <Path d="M34 16 l6 8 l8 1 l-6 5 l2 8 l-8 -4 l-8 4 l2 -8 l-6 -5 l8 -1 z" fill="#C9A24D" />
      </G>
    ),
  },
  sprout: {
    fill: '#F7F1E1',
    shade: '#E7D3B0',
    eye: '#5C3A45',
    extra: (
      <G>
        <Ellipse cx={40} cy={24} rx={20} ry={12} fill="#E36B6B" />
        <Circle cx={30} cy={22} r={2.4} fill="#F7E2C8" />
        <Circle cx={42} cy={18} r={2} fill="#F7E2C8" />
        <Ellipse cx={54} cy={16} rx={5} ry={3} fill="#7DCE82" transform="rotate(-30 54 16)" />
      </G>
    ),
  },
  glitter: {
    fill: '#FFF6F8',
    shade: '#FFD0E4',
    eye: '#5C3A45',
    extra: (
      <G>
        <Ellipse cx={24} cy={18} rx={6} ry={14} fill="#FFF6F8" />
        <Ellipse cx={56} cy={18} rx={6} ry={14} fill="#FFF6F8" />
        <Ellipse cx={24} cy={18} rx={3} ry={8} fill="#FFD0E4" />
        <Ellipse cx={56} cy={18} rx={3} ry={8} fill="#FFD0E4" />
        <Ellipse cx={34} cy={16} rx={5} ry={3.5} fill="#FF4F9A" transform="rotate(-20 34 16)" />
        <Ellipse cx={46} cy={16} rx={5} ry={3.5} fill="#FF8AC6" transform="rotate(20 46 16)" />
        <Circle cx={40} cy={16} r={2.4} fill="#FFE56A" />
      </G>
    ),
  },
  prism: {
    fill: '#9FD6E8',
    shade: '#7EC0D8',
    eye: '#2A4A58',
    extra: (
      <G>
        {['#FF6B6B', '#FFE56A', '#7DCE82'].map((gill, index) => (
          <Path key={gill} d={`M ${58} ${28 + index * 5} Q 72 ${26 + index * 5} 66 ${34 + index * 4}`} stroke={gill} strokeWidth={2} fill="none" strokeLinecap="round" />
        ))}
        <Path d="M18 62 Q8 70 16 76" stroke="#8ECAE6" strokeWidth={4} fill="none" strokeLinecap="round" />
      </G>
    ),
  },
  inky: {
    fill: '#2C3A68',
    shade: '#1B2748',
    eye: '#F2C14E',
    extra: (
      <G>
        <Path d="M28 70 C30 80 38 78 36 70" fill="#243156" />
        <Rect x={54} y={48} width={12} height={3} rx={1} fill="#F2C14E" transform="rotate(30 60 50)" />
      </G>
    ),
  },
  pip: {
    fill: '#FFE56A',
    shade: '#F2C14E',
    eye: '#5C3A45',
    extra: (
      <G>
        <Path d="M48 40 L58 43 L48 46 Z" fill="#FF8A5B" />
        <Ellipse cx={32} cy={74} rx={5} ry={2.4} fill="#FF8A5B" />
        <Ellipse cx={48} cy={74} rx={5} ry={2.4} fill="#FF8A5B" />
      </G>
    ),
  },
  nova: {
    fill: '#FFE9A0',
    shade: '#F2C14E',
    eye: '#5C3A45',
    extra: <Path d="M40 4 L46 16 L40 14 L34 16 Z M64 28 L52 32 L56 24 Z M16 28 L28 32 L24 24 Z" fill="#F6C445" />,
  },
  shelly: {
    fill: '#E6DCFF',
    shade: '#C9B6F2',
    eye: '#5C3A45',
    extra: (
      <G>
        <Path d="M24 66 Q20 78 18 84" stroke="#B7A0E8" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M34 68 Q34 80 30 86" stroke="#8ECAE6" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M48 68 Q50 80 54 86" stroke="#F4A3B8" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M58 66 Q62 76 64 82" stroke="#C9B6F2" strokeWidth={3} fill="none" strokeLinecap="round" />
      </G>
    ),
  },
  ghosty: {
    fill: '#F7F4FA',
    shade: '#E4D8EE',
    eye: '#5C3A45',
    extra: <Path d="M22 64 Q28 74 34 66 Q40 78 46 66 Q52 76 58 64" fill="#F7F4FA" stroke="#E4D8EE" strokeWidth={1} />,
  },
  ember: {
    fill: '#8EAE78',
    shade: '#5E7A48',
    eye: '#3A2A22',
    extra: (
      <G>
        <Path d="M30 22 L26 10 L36 20 Z" fill="#F2C14E" />
        <Path d="M50 22 L54 10 L44 20 Z" fill="#E7C16A" />
        <Path d="M16 40 C6 30 10 48 18 50 Z" fill="#5E7A48" />
        <Path d="M64 40 C74 30 70 48 62 50 Z" fill="#5E7A48" />
        <Ellipse cx={40} cy={60} rx={8} ry={5} fill="#F2C14E" />
      </G>
    ),
  },
  lumi: {
    fill: '#FFFDF8',
    shade: '#F4D5E4',
    eye: '#5C3A45',
    extra: (
      <G>
        <Path d="M36 16 L40 2 L44 16 Z" fill="#F2C14E" />
        <Path d="M22 28 Q14 20 20 34" fill="#FF8FB8" />
        <Path d="M58 26 Q68 18 62 34" fill="#C9B6F2" />
        <Path d="M64 32 Q74 30 68 40" fill="#8ECAE6" />
      </G>
    ),
  },
};

export function Plushie({ buddyId, size = 72, ink = '#5C3A45' }: { buddyId: string; size?: number; ink?: string }) {
  const look = LOOKS[buddyId] ?? LOOKS.mochi;
  return (
    <Svg width={size} height={size * (88 / 80)} viewBox="0 0 80 88">
      <Path d={OUTLINE} fill="#FFFFFF" />
      <Path d={OUTLINE} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" />
      <Path d="M40 8 C56 6 70 20 68 36 C76 44 70 58 58 64 C60 76 46 82 36 78 C22 82 10 72 14 60 C6 50 12 36 24 32 C18 16 28 8 40 8 Z" fill="none" stroke={ink} strokeWidth={1.25} strokeLinejoin="round" />
      {body(look.fill, look.shade)}
      {look.extra}
      {face(look.eye)}
    </Svg>
  );
}
