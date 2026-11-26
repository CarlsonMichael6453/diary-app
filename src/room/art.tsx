import { useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Image as SvgImage, Path, Rect } from 'react-native-svg';

import { strokesFrom } from '../logic/drawing';
import { usePhotoUri } from '../services/photoStorage';
import { isFrame, type RoomTheme } from './catalog';
import { fitDrawing } from './fitDrawing';
import { Plushie } from './plush';

const EASEL_CANVAS = { x: 18, y: 16, w: 124, h: 108 };

function EaselPicture({ drawing, width }: { drawing?: string | null; width: number }) {
  const height = Math.round(width * (188 / 160));
  const strokes = fitDrawing(strokesFrom(drawing), EASEL_CANVAS);
  return (
    <Svg width={width} height={height} viewBox="0 0 160 188">
      <Path d="M80 168 L28 36 H132 L80 168" fill="#E7C99A" stroke="#8C5A3C" strokeWidth={3} />
      <Rect x={14} y={12} width={132} height={116} rx={2} fill="#FFFDF8" stroke="#8C5A3C" strokeWidth={4} />
      {strokes.map((stroke, index) => (
        <Path key={index} d={stroke.d} stroke={stroke.color} strokeWidth={stroke.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <Path d="M46 150 L80 178 L114 150" stroke="#8C5A3C" strokeWidth={5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FramePicture({ kind, photo, width }: { kind: string; photo?: string | null; width: number }) {
  const resolvedPhoto = usePhotoUri(photo);
  const clip = `frame${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const height = Math.round(width * 0.88);
  const pastel = kind === 'frame-pastel';
  const polaroid = kind === 'frame-polaroid';
  const gold = kind === 'frame-gold';
  const opening = polaroid ? { x: 14, y: 10, w: 72, h: 48 } : { x: 16, y: 14, w: 68, h: 50 };
  const border = gold ? '#C9A24D' : pastel ? '#F4A4B8' : polaroid ? '#E7D3C0' : '#8C5A3C';
  const mat = gold ? '#F8E7B0' : pastel ? '#FFF0F6' : polaroid ? '#FFFDF8' : '#E7C99A';
  return (
    <Svg width={width} height={height} viewBox="0 0 100 88">
      <Defs>
        <ClipPath id={clip}>
          <Rect x={opening.x} y={opening.y} width={opening.w} height={opening.h} />
        </ClipPath>
      </Defs>
      <Rect x={4} y={4} width={92} height={80} rx={pastel ? 12 : 3} fill={mat} stroke={border} strokeWidth={gold ? 7 : polaroid ? 1.5 : 6} />
      {gold ? <Rect x={12} y={10} width={76} height={64} fill="none" stroke="#FFF6D8" strokeWidth={2} /> : null}
      {resolvedPhoto ? (
        <G clipPath={`url(#${clip})`}>
          <SvgImage href={resolvedPhoto} x={opening.x} y={opening.y} width={opening.w} height={opening.h} preserveAspectRatio="xMidYMid slice" />
        </G>
      ) : (
        <G>
          <Rect x={opening.x} y={opening.y} width={opening.w} height={opening.h} fill="#C9E7F2" />
          <Circle cx={opening.x + opening.w * 0.35} cy={opening.y + opening.h * 0.4} r={8} fill="#F6C445" />
        </G>
      )}
    </Svg>
  );
}

export function spriteBox(kind: string, scale = 1): { width: number; height: number } {
  if (kind === 'easel') return { width: 176, height: Math.round(176 * (188 / 160)) };
  if (isFrame(kind)) {
    const width = Math.round(112 * scale);
    return { width, height: Math.round(width * 0.88) };
  }
  if (kind.startsWith('plush-')) return { width: 72, height: Math.round(72 * (88 / 80)) };
  return { width: 72, height: 72 };
}

export function RoomSprite({ kind, photo, drawing, size = 72, width, ink }: { kind: string; photo?: string | null; drawing?: string | null; size?: number; width?: number; ink?: string }) {
  const spriteWidth = width ?? size;
  if (kind.startsWith('plush-')) return <Plushie buddyId={kind.slice(6)} size={spriteWidth} ink={ink} />;
  if (isFrame(kind)) return <FramePicture kind={kind} photo={photo} width={spriteWidth} />;
  if (kind === 'easel') return <EaselPicture drawing={drawing} width={spriteWidth} />;
  const body = spriteBody(kind);
  return <Svg width={spriteWidth} height={spriteWidth} viewBox="0 0 80 80">{body}</Svg>;
}

export function RoomSwatch({ theme, width, height, night = false }: { theme: RoomTheme; width: number; height: number; night?: boolean }) {
  return (
    <View style={{ width, height, borderRadius: 10, overflow: 'hidden' }}>
      <RoomBackdrop wall={theme.wall} floor={theme.floor} trim={theme.trim} window={theme.window} night={night} />
    </View>
  );
}

function spriteBody(kind: string): ReactNode {
  const art: Record<string, ReactNode> = {
    rug: <Ellipse cx={40} cy={40} rx={36} ry={16} fill="#C46B6B" />,
    bed: (
      <G>
        <Rect x={8} y={28} width={64} height={28} rx={6} fill="#F4F1EA" stroke="#8C5A3C" strokeWidth={2} />
        <Rect x={12} y={22} width={20} height={12} rx={3} fill="#F4A4B8" />
      </G>
    ),
    armchair: (
      <G>
        <Path d="M14 36 H66 V58 H14 Z" fill="#7A8CFF" />
        <Rect x={10} y={28} width={12} height={30} rx={4} fill="#5C6BC4" />
        <Rect x={58} y={28} width={12} height={30} rx={4} fill="#5C6BC4" />
      </G>
    ),
    bookshelf: (
      <G>
        <Rect x={16} y={10} width={48} height={54} fill="#8C5A3C" />
        <Rect x={20} y={16} width={16} height={18} fill="#E85D4C" />
        <Rect x={38} y={16} width={20} height={18} fill="#F6C445" />
        <Rect x={20} y={38} width={38} height={16} fill="#7DCE82" />
      </G>
    ),
    desk: <Rect x={8} y={28} width={64} height={28} rx={4} fill="#E7C99A" stroke="#8C5A3C" strokeWidth={2} />,
    lamp: (
      <G>
        <Path d="M24 28 H56 L50 8 H30 Z" fill="#F6C445" />
        <Rect x={37} y={28} width={6} height={28} fill="#8C5A3C" />
      </G>
    ),
    plant: (
      <G>
        <Path d="M40 58 C20 40 24 16 40 20 C56 16 60 40 40 58" fill="#7DCE82" />
        <Rect x={34} y={52} width={12} height={12} fill="#C46B6B" />
      </G>
    ),
    curtains: <Path d="M8 6 H72 V20 C56 32 48 18 40 28 C32 18 24 32 8 20 Z" fill="#F4A4B8" />,
    clock: (
      <G>
        <Circle cx={40} cy={36} r={18} fill="#FFFDF8" stroke="#3A2A32" strokeWidth={2} />
        <Path d="M40 36 L40 24 M40 36 L50 40" stroke="#3A2A32" strokeWidth={2} />
      </G>
    ),
    lights: <Path d="M6 16 Q40 28 74 16" stroke="#F6C445" strokeWidth={3} fill="none" />,
    beanbag: <Ellipse cx={40} cy={42} rx={28} ry={18} fill="#C9A0DC" />,
    record: (
      <G>
        <Rect x={10} y={30} width={60} height={24} rx={4} fill="#5C4030" />
        <Circle cx={28} cy={42} r={8} fill="#111" />
      </G>
    ),
    fishbowl: (
      <G>
        <Path d="M18 28 H62 V52 Q40 68 18 52 Z" fill="#9FD6E8" opacity={0.85} stroke="#2E86AB" />
        <Circle cx={40} cy={44} r={4} fill="#FF8A5B" />
      </G>
    ),
    tea: (
      <G>
        <Path d="M22 36 H50 V52 H22 Z" fill="#FFFDF8" stroke="#8C5A3C" />
        <Path d="M50 40 H58 V48 H50" stroke="#8C5A3C" fill="none" />
      </G>
    ),
    catbed: <Ellipse cx={40} cy={44} rx={26} ry={14} fill="#F4A4B8" />,
    shelf: <Rect x={12} y={30} width={56} height={6} fill="#8C5A3C" />,
    poster: <Rect x={22} y={8} width={36} height={44} fill="#F29BB3" stroke="#3A2A32" />,
    cushion: <Ellipse cx={40} cy={44} rx={22} ry={12} fill="#8ECAE6" />,
    pumpkin: <Ellipse cx={40} cy={40} rx={18} ry={14} fill="#FF8A00" />,
  };
  return art[kind] ?? <Circle cx={40} cy={40} r={12} fill="#F4A4B8" />;
}

export function RoomBackdrop({ wall, floor, trim, window, night }: { wall: string; floor: string; trim: string; window: string; night: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 420" preserveAspectRatio="none">
      <Rect x={0} y={0} width={320} height={280} fill={wall} />
      <Rect x={0} y={280} width={320} height={140} fill={floor} />
      <Rect x={118} y={36} width={84} height={70} rx={8} fill={night ? '#1C2440' : window} stroke={trim} strokeWidth={4} />
      {night ? <Circle cx={150} cy={62} r={8} fill="#F6C445" /> : <Circle cx={168} cy={58} r={10} fill="#FFF6D8" />}
      <Path d="M0 280 H320" stroke={trim} strokeWidth={4} />
    </Svg>
  );
}
