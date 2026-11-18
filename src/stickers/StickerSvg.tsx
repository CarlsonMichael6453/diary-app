import { Circle, Ellipse, G, Line, Path, Polygon, Rect, Svg } from 'react-native-svg';

import { drawArt } from './art';
import type { DrawNode, Palette, ArtKey } from './types';

function NodeView({ node }: { node: DrawNode }) {
  const opacity = 'o' in node ? node.o : undefined;
  if (node.t === 'c') {
    return <Circle cx={node.cx} cy={node.cy} r={node.r} fill={node.f} stroke={node.s} strokeWidth={node.sw} opacity={opacity} />;
  }
  if (node.t === 'e') {
    const body = (
      <Ellipse
        cx={node.cx}
        cy={node.cy}
        rx={node.rx}
        ry={node.ry}
        fill={node.f}
        stroke={node.s}
        strokeWidth={node.sw}
        opacity={opacity}
      />
    );
    if (!node.rot) return body;
    return <G transform={`rotate(${node.rot} ${node.cx} ${node.cy})`}>{body}</G>;
  }
  if (node.t === 'r') {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    const body = (
      <Rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={node.rx}
        fill={node.f}
        stroke={node.s}
        strokeWidth={node.sw}
        opacity={opacity}
      />
    );
    if (!node.rot) return body;
    return <G transform={`rotate(${node.rot} ${cx} ${cy})`}>{body}</G>;
  }
  if (node.t === 'p') {
    return (
      <Path
        d={node.d}
        fill={node.f ?? 'none'}
        stroke={node.s}
        strokeWidth={node.sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    );
  }
  if (node.t === 'pg') {
    return <Polygon points={node.pts} fill={node.f} stroke={node.s} strokeWidth={node.sw} />;
  }
  return <Line x1={node.x1} y1={node.y1} x2={node.x2} y2={node.y2} stroke={node.s} strokeWidth={node.sw ?? 2} strokeLinecap="round" />;
}

export function StickerSvg({ art, colors, size }: { art: ArtKey; colors: Palette; size: number }) {
  const nodes = drawArt(art, colors);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {nodes.map((node, index) => (
        <NodeView key={index} node={node} />
      ))}
    </Svg>
  );
}
