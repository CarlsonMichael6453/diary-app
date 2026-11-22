export type DrawnStroke = { points: string; color: string; size?: number };

export type FittedStroke = { d: string; color: string; width: number };

/** Scale ink into the easel canvas so a small sketch fills the board without going soft. */
export function fitDrawing(
  strokes: DrawnStroke[],
  box: { x: number; y: number; w: number; h: number },
): FittedStroke[] {
  const parsed = strokes
    .filter((stroke) => stroke.color !== 'eraser')
    .map((stroke) => ({
      color: stroke.color,
      size: stroke.size ?? 3,
      pts: stroke.points
        .trim()
        .split(/\s+/)
        .map((pair) => {
          const [x, y] = pair.split(',').map(Number);
          return { x, y };
        })
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
    }))
    .filter((stroke) => stroke.pts.length > 0);
  if (!parsed.length) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of parsed) {
    for (const point of stroke.pts) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }
  const spanX = Math.max(8, maxX - minX);
  const spanY = Math.max(8, maxY - minY);
  const pad = Math.min(box.w, box.h) * 0.08;
  const scale = Math.min((box.w - pad * 2) / spanX, (box.h - pad * 2) / spanY);
  const offsetX = box.x + (box.w - spanX * scale) / 2;
  const offsetY = box.y + (box.h - spanY * scale) / 2;
  return parsed.map((stroke) => ({
    color: stroke.color,
    width: Math.max(1.6, stroke.size * scale),
    d: stroke.pts
      .map((point, index) => {
        const x = (offsetX + (point.x - minX) * scale).toFixed(1);
        const y = (offsetY + (point.y - minY) * scale).toFixed(1);
        return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' '),
  }));
}
