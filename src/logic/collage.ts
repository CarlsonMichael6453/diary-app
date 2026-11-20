export type PhotoFrame = 'none' | 'polaroid' | 'tape' | 'round';

export type CollagePreset = 'two' | 'three' | 'grid' | 'scatter' | 'full';

export type CollageSlot = { x: number; y: number; scale: number; rotation: number; frame: PhotoFrame };

const SCATTER = [
  { x: 0.28, y: 0.46, rotation: -8 },
  { x: 0.7, y: 0.52, rotation: 6 },
  { x: 0.42, y: 0.7, rotation: -3 },
  { x: 0.74, y: 0.78, rotation: 9 },
  { x: 0.22, y: 0.82, rotation: 4 },
  { x: 0.55, y: 0.6, rotation: -6 },
];

/** Positions for the photos already on the page. Extra photos keep a gentle grid. */
export function collageSlots(preset: CollagePreset, count: number): CollageSlot[] {
  const n = Math.max(0, count);
  if (preset === 'full') {
    return Array.from({ length: n }, (_, index) => ({
      x: index === 0 ? 0.5 : 0.18 + (index % 4) * 0.2,
      y: index === 0 ? 0.58 : 0.86,
      scale: index === 0 ? 2.4 : 0.7,
      rotation: 0,
      frame: 'none' as const,
    }));
  }
  if (preset === 'two') {
    return Array.from({ length: n }, (_, index) => ({
      x: index % 2 === 0 ? 0.3 : 0.7,
      y: 0.48 + Math.floor(index / 2) * 0.28,
      scale: 1.15,
      rotation: index % 2 === 0 ? -3 : 3,
      frame: 'none' as const,
    }));
  }
  if (preset === 'three') {
    return Array.from({ length: n }, (_, index) => {
      if (index % 3 === 0) return { x: 0.34, y: 0.5, scale: 1.45, rotation: -2, frame: 'none' as const };
      if (index % 3 === 1) return { x: 0.74, y: 0.46, scale: 0.9, rotation: 4, frame: 'none' as const };
      return { x: 0.74, y: 0.72, scale: 0.9, rotation: -4, frame: 'none' as const };
    });
  }
  if (preset === 'scatter') {
    return Array.from({ length: n }, (_, index) => {
      const spot = SCATTER[index % SCATTER.length];
      return { x: spot.x, y: spot.y, scale: 1, rotation: spot.rotation, frame: 'polaroid' as const };
    });
  }
  const columns = n > 4 ? 3 : 2;
  return Array.from({ length: n }, (_, index) => ({
    x: 0.24 + (index % columns) * (columns === 3 ? 0.26 : 0.4),
    y: 0.42 + Math.floor(index / columns) * 0.24,
    scale: columns === 3 ? 0.85 : 1.05,
    rotation: 0,
    frame: 'none' as const,
  }));
}
