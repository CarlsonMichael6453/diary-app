import type { ArtKey, DrawNode, Palette } from './types';

const none = 'none';

function starPts(cx: number, cy: number, r: number, n = 5, inner = 0.46): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i += 1) {
    const rad = (Math.PI / n) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + Math.cos(rad) * rr).toFixed(1)},${(cy + Math.sin(rad) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}

function face(cx: number, cy: number, ink: string, blush: string): DrawNode[] {
  return [
    { t: 'c', cx: cx - 7, cy, r: 2.1, f: ink },
    { t: 'c', cx: cx + 7, cy, r: 2.1, f: ink },
    { t: 'e', cx: cx - 9, cy: cy + 6, rx: 3.2, ry: 1.7, f: blush },
    { t: 'e', cx: cx + 9, cy: cy + 6, rx: 3.2, ry: 1.7, f: blush },
    { t: 'p', d: `M ${cx - 4} ${cy + 7} Q ${cx} ${cy + 11} ${cx + 4} ${cy + 7}`, f: none, s: ink, sw: 1.5 },
  ];
}

function heart(cx: number, cy: number, s: number, f: string): DrawNode {
  return {
    t: 'p',
    f,
    d: `M ${cx} ${cy + s * 0.72} C ${cx - s} ${cy - s * 0.05}, ${cx - s * 0.55} ${cy - s}, ${cx} ${cy - s * 0.32} C ${cx + s * 0.55} ${cy - s}, ${cx + s} ${cy - s * 0.05}, ${cx} ${cy + s * 0.72} Z`,
  };
}

const art: Record<ArtKey, (p: Palette) => DrawNode[]> = {
  star: (p) => [{ t: 'pg', pts: starPts(50, 52, 34), f: p.main, s: p.detail, sw: 2 }, { t: 'c', cx: 50, cy: 52, r: 5, f: p.accent }],
  sparkle: (p) => [
    { t: 'pg', pts: starPts(50, 50, 30, 4, 0.18), f: p.main },
    { t: 'pg', pts: starPts(22, 28, 10, 4, 0.2), f: p.accent },
    { t: 'pg', pts: starPts(76, 72, 8, 4, 0.2), f: p.alt },
  ],
  moon: (p) => [
    { t: 'c', cx: 46, cy: 50, r: 28, f: p.main },
    { t: 'c', cx: 60, cy: 42, r: 22, f: p.soft },
    { t: 'c', cx: 38, cy: 44, r: 3, f: p.accent, o: 0.8 },
    { t: 'c', cx: 34, cy: 58, r: 2, f: p.accent, o: 0.7 },
  ],
  cloud: (p) => [
    { t: 'c', cx: 38, cy: 58, r: 16, f: p.main },
    { t: 'c', cx: 56, cy: 50, r: 20, f: p.main },
    { t: 'c', cx: 72, cy: 58, r: 14, f: p.main },
    { t: 'e', cx: 54, cy: 66, rx: 28, ry: 12, f: p.main },
    { t: 'e', cx: 46, cy: 58, rx: 6, ry: 3, f: p.soft, o: 0.7 },
  ],
  heart: (p) => [heart(50, 54, 28, p.main), { t: 'e', cx: 38, cy: 46, rx: 6, ry: 3, f: '#fff', o: 0.35 }],
  bow: (p) => [
    { t: 'e', cx: 32, cy: 50, rx: 18, ry: 12, f: p.main, rot: -20 },
    { t: 'e', cx: 68, cy: 50, rx: 18, ry: 12, f: p.main, rot: 20 },
    { t: 'c', cx: 50, cy: 50, r: 8, f: p.accent },
    { t: 'p', d: 'M46 56 L36 78 L48 66 Z', f: p.alt },
    { t: 'p', d: 'M54 56 L64 78 L52 66 Z', f: p.alt },
  ],
  cherry: (p) => [
    { t: 'p', d: 'M50 18 C58 36 40 40 46 52', f: none, s: p.detail, sw: 2 },
    { t: 'p', d: 'M50 18 C60 34 70 36 62 50', f: none, s: p.detail, sw: 2 },
    { t: 'e', cx: 58, cy: 24, rx: 8, ry: 4, f: p.accent, rot: -30 },
    { t: 'c', cx: 40, cy: 62, r: 14, f: p.main },
    { t: 'c', cx: 64, cy: 60, r: 14, f: p.main },
    { t: 'c', cx: 36, cy: 56, r: 3, f: '#fff', o: 0.45 },
  ],
  butterfly: (p) => [
    { t: 'e', cx: 32, cy: 42, rx: 18, ry: 16, f: p.main, rot: -20 },
    { t: 'e', cx: 68, cy: 42, rx: 18, ry: 16, f: p.main, rot: 20 },
    { t: 'e', cx: 30, cy: 66, rx: 14, ry: 16, f: p.alt, rot: 16 },
    { t: 'e', cx: 70, cy: 66, rx: 14, ry: 16, f: p.alt, rot: -16 },
    { t: 'e', cx: 50, cy: 52, rx: 5, ry: 18, f: p.detail },
    { t: 'c', cx: 32, cy: 42, r: 4, f: p.accent },
    { t: 'c', cx: 68, cy: 42, r: 4, f: p.accent },
  ],
  blossom: (p) => {
    const nodes: DrawNode[] = [];
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6;
      nodes.push({ t: 'e', cx: 50 + Math.cos(a) * 16, cy: 52 + Math.sin(a) * 16, rx: 10, ry: 14, f: p.main, rot: (a * 180) / Math.PI });
    }
    nodes.push({ t: 'c', cx: 50, cy: 52, r: 8, f: p.accent });
    return nodes;
  },
  bunny: (p) => [
    { t: 'e', cx: 34, cy: 30, rx: 8, ry: 18, f: p.main },
    { t: 'e', cx: 66, cy: 30, rx: 8, ry: 18, f: p.main },
    { t: 'e', cx: 34, cy: 32, rx: 4, ry: 10, f: p.alt },
    { t: 'e', cx: 66, cy: 32, rx: 4, ry: 10, f: p.alt },
    { t: 'c', cx: 50, cy: 58, r: 26, f: p.main },
    ...face(50, 58, p.detail, p.accent),
  ],
  cat: (p) => [
    { t: 'pg', pts: '28,48 38,22 48,46', f: p.main },
    { t: 'pg', pts: '72,48 62,22 52,46', f: p.main },
    { t: 'pg', pts: '34,40 38,28 44,42', f: p.alt },
    { t: 'pg', pts: '66,40 62,28 56,42', f: p.alt },
    { t: 'c', cx: 50, cy: 58, r: 26, f: p.main },
    ...face(50, 60, p.detail, p.accent),
    { t: 'ln', x1: 22, y1: 58, x2: 36, y2: 60, s: p.detail, sw: 1.4 },
    { t: 'ln', x1: 78, y1: 58, x2: 64, y2: 60, s: p.detail, sw: 1.4 },
  ],
  frog: (p) => [
    { t: 'c', cx: 32, cy: 36, r: 12, f: p.main },
    { t: 'c', cx: 68, cy: 36, r: 12, f: p.main },
    { t: 'c', cx: 32, cy: 36, r: 6, f: p.soft },
    { t: 'c', cx: 68, cy: 36, r: 6, f: p.soft },
    { t: 'c', cx: 32, cy: 36, r: 2.4, f: p.detail },
    { t: 'c', cx: 68, cy: 36, r: 2.4, f: p.detail },
    { t: 'e', cx: 50, cy: 64, rx: 28, ry: 20, f: p.main },
    { t: 'p', d: 'M44 66 Q50 72 56 66', f: none, s: p.detail, sw: 1.6 },
    { t: 'e', cx: 40, cy: 62, rx: 4, ry: 2, f: p.accent },
    { t: 'e', cx: 60, cy: 62, rx: 4, ry: 2, f: p.accent },
  ],
  bear: (p) => [
    { t: 'c', cx: 28, cy: 32, r: 12, f: p.main },
    { t: 'c', cx: 72, cy: 32, r: 12, f: p.main },
    { t: 'c', cx: 28, cy: 32, r: 6, f: p.alt },
    { t: 'c', cx: 72, cy: 32, r: 6, f: p.alt },
    { t: 'c', cx: 50, cy: 58, r: 28, f: p.main },
    { t: 'e', cx: 50, cy: 66, rx: 10, ry: 8, f: p.alt },
    ...face(50, 56, p.detail, p.accent),
  ],
  chick: (p) => [
    { t: 'c', cx: 50, cy: 56, r: 28, f: p.main },
    { t: 'pg', pts: '42,58 50,70 58,58', f: p.accent },
    { t: 'c', cx: 40, cy: 50, r: 3, f: p.detail },
    { t: 'c', cx: 60, cy: 50, r: 3, f: p.detail },
    { t: 'e', cx: 36, cy: 78, rx: 8, ry: 4, f: p.accent },
    { t: 'e', cx: 64, cy: 78, rx: 8, ry: 4, f: p.accent },
    { t: 'e', cx: 28, cy: 60, rx: 8, ry: 6, f: p.alt },
  ],
  mushroom: (p) => [
    { t: 'e', cx: 50, cy: 46, rx: 32, ry: 22, f: p.main },
    { t: 'r', x: 40, y: 52, w: 20, h: 28, rx: 8, f: p.soft },
    { t: 'c', cx: 36, cy: 40, r: 5, f: p.alt },
    { t: 'c', cx: 52, cy: 34, r: 4, f: p.alt },
    { t: 'c', cx: 64, cy: 44, r: 3.5, f: p.alt },
    ...face(50, 64, p.detail, p.accent),
  ],
  leaf: (p) => [
    { t: 'p', d: 'M50 16 C78 30 80 62 50 88 C20 62 22 30 50 16 Z', f: p.main },
    { t: 'p', d: 'M50 22 L50 82', f: none, s: p.detail, sw: 1.6 },
    { t: 'p', d: 'M50 40 L34 32 M50 52 L68 44 M50 64 L36 60', f: none, s: p.alt, sw: 1.4 },
  ],
  strawberry: (p) => [
    { t: 'p', d: 'M50 28 C72 36 78 60 50 86 C22 60 28 36 50 28 Z', f: p.main },
    { t: 'p', d: 'M38 30 Q50 18 62 30 Q56 38 50 34 Q44 38 38 30 Z', f: p.accent },
    { t: 'c', cx: 42, cy: 52, r: 1.6, f: p.soft },
    { t: 'c', cx: 54, cy: 48, r: 1.6, f: p.soft },
    { t: 'c', cx: 48, cy: 62, r: 1.6, f: p.soft },
    { t: 'c', cx: 60, cy: 60, r: 1.6, f: p.soft },
  ],
  bee: (p) => [
    { t: 'e', cx: 50, cy: 56, rx: 22, ry: 16, f: p.main },
    { t: 'r', x: 40, y: 46, w: 6, h: 20, f: p.detail },
    { t: 'r', x: 52, y: 44, w: 6, h: 24, f: p.detail },
    { t: 'e', cx: 30, cy: 46, rx: 12, ry: 7, f: p.soft, o: 0.9 },
    { t: 'e', cx: 70, cy: 46, rx: 12, ry: 7, f: p.soft, o: 0.9 },
    { t: 'c', cx: 42, cy: 54, r: 2, f: p.detail },
    { t: 'c', cx: 50, cy: 54, r: 2, f: p.detail },
    { t: 'p', d: 'M34 40 Q30 28 38 30', f: none, s: p.detail, sw: 1.4 },
  ],
  teapot: (p) => [
    { t: 'e', cx: 48, cy: 58, rx: 22, ry: 18, f: p.main },
    { t: 'p', d: 'M68 52 C84 50 86 68 68 70', f: none, s: p.detail, sw: 3 },
    { t: 'p', d: 'M28 56 C16 50 16 70 30 68', f: none, s: p.main, sw: 4 },
    { t: 'e', cx: 48, cy: 40, rx: 12, ry: 5, f: p.alt },
    { t: 'c', cx: 60, cy: 38, r: 3, f: p.accent },
    { t: 'p', d: 'M44 30 Q48 22 52 30', f: none, s: p.soft, sw: 1.5 },
  ],
  loaf: (p) => [
    { t: 'p', d: 'M18 64 Q18 40 50 38 Q82 40 82 64 Q82 78 50 78 Q18 78 18 64 Z', f: p.main },
    { t: 'p', d: 'M30 58 Q50 48 70 58', f: none, s: p.detail, sw: 2 },
    { t: 'p', d: 'M36 66 Q50 58 64 66', f: none, s: p.alt, sw: 1.6 },
  ],
  rainbow: (p) => [
    { t: 'p', d: 'M16 70 A34 34 0 0 1 84 70', f: none, s: p.main, sw: 6 },
    { t: 'p', d: 'M24 70 A26 26 0 0 1 76 70', f: none, s: p.accent, sw: 6 },
    { t: 'p', d: 'M32 70 A18 18 0 0 1 68 70', f: none, s: p.alt, sw: 6 },
    { t: 'c', cx: 18, cy: 74, r: 8, f: p.soft },
    { t: 'c', cx: 82, cy: 74, r: 8, f: p.soft },
  ],
  sun: (p) => {
    const nodes: DrawNode[] = [{ t: 'c', cx: 50, cy: 52, r: 18, f: p.main }];
    for (let i = 0; i < 10; i += 1) {
      const a = (Math.PI * 2 * i) / 10;
      nodes.push({
        t: 'ln',
        x1: 50 + Math.cos(a) * 24,
        y1: 52 + Math.sin(a) * 24,
        x2: 50 + Math.cos(a) * 34,
        y2: 52 + Math.sin(a) * 34,
        s: p.accent,
        sw: 3,
      });
    }
    nodes.push(...face(50, 52, p.detail, p.alt));
    return nodes;
  },
  smiley: (p) => [
    { t: 'c', cx: 50, cy: 50, r: 32, f: p.main },
    { t: 'c', cx: 38, cy: 44, r: 4, f: p.detail },
    { t: 'c', cx: 62, cy: 44, r: 4, f: p.detail },
    { t: 'p', d: 'M34 56 Q50 74 66 56', f: none, s: p.detail, sw: 3 },
  ],
  pop: (p) => [
    { t: 'c', cx: 50, cy: 40, r: 22, f: p.main },
    { t: 'r', x: 46, y: 58, w: 8, h: 28, rx: 3, f: p.soft },
    { t: 'p', d: 'M50 28 C58 36 44 40 52 48', f: none, s: p.alt, sw: 2 },
    { t: 'r', x: 40, y: 84, w: 20, h: 6, rx: 2, f: p.accent },
  ],
  bat: (p) => [
    { t: 'p', d: 'M50 58 C30 40 12 48 10 36 C24 40 32 30 36 42 C40 28 50 30 50 42 C50 30 60 28 64 42 C68 30 76 40 90 36 C88 48 70 40 50 58 Z', f: p.main },
    { t: 'c', cx: 42, cy: 50, r: 2, f: p.accent },
    { t: 'c', cx: 58, cy: 50, r: 2, f: p.accent },
    { t: 'pg', pts: '46,56 50,62 54,56', f: p.alt },
  ],
  ghost: (p) => [
    { t: 'p', d: 'M28 78 C28 40 72 40 72 78 L66 72 L58 80 L50 70 L42 80 L34 72 Z', f: p.main },
    { t: 'c', cx: 42, cy: 58, r: 3, f: p.detail },
    { t: 'c', cx: 58, cy: 58, r: 3, f: p.detail },
    { t: 'e', cx: 50, cy: 68, rx: 5, ry: 3, f: p.alt },
  ],
  candle: (p) => [
    { t: 'r', x: 40, y: 42, w: 20, h: 40, rx: 4, f: p.soft },
    { t: 'p', d: 'M50 40 C44 30 56 26 50 16 C58 26 52 32 50 40 Z', f: p.accent },
    { t: 'e', cx: 50, cy: 82, rx: 16, ry: 5, f: p.main },
    { t: 'p', d: 'M44 50 H56', f: none, s: p.alt, sw: 2 },
  ],
  potion: (p) => [
    { t: 'p', d: 'M42 28 H58 L54 42 C74 48 74 80 50 84 C26 80 26 48 46 42 Z', f: p.main },
    { t: 'r', x: 44, y: 20, w: 12, h: 10, rx: 2, f: p.detail },
    { t: 'c', cx: 42, cy: 62, r: 3, f: p.soft, o: 0.8 },
    { t: 'c', cx: 54, cy: 70, r: 2, f: p.soft, o: 0.8 },
    { t: 'e', cx: 50, cy: 58, rx: 10, ry: 6, f: p.accent, o: 0.9 },
  ],
  rose: (p) => [
    { t: 'c', cx: 50, cy: 48, r: 10, f: p.alt },
    { t: 'e', cx: 38, cy: 46, rx: 12, ry: 8, f: p.main, rot: -30 },
    { t: 'e', cx: 62, cy: 46, rx: 12, ry: 8, f: p.main, rot: 30 },
    { t: 'e', cx: 50, cy: 36, rx: 10, ry: 8, f: p.main },
    { t: 'e', cx: 50, cy: 58, rx: 12, ry: 8, f: p.accent },
    { t: 'p', d: 'M50 66 L50 88', f: none, s: p.detail, sw: 2 },
    { t: 'e', cx: 62, cy: 76, rx: 8, ry: 4, f: p.soft, rot: 30 },
  ],
  web: (p) => {
    const nodes: DrawNode[] = [
      { t: 'c', cx: 50, cy: 50, r: 8, f: none, s: p.main, sw: 1.4 },
      { t: 'c', cx: 50, cy: 50, r: 18, f: none, s: p.main, sw: 1.4 },
      { t: 'c', cx: 50, cy: 50, r: 28, f: none, s: p.main, sw: 1.4 },
    ];
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      nodes.push({ t: 'ln', x1: 50, y1: 50, x2: 50 + Math.cos(a) * 32, y2: 50 + Math.sin(a) * 32, s: p.detail, sw: 1.2 });
    }
    return nodes;
  },
  book: (p) => [
    { t: 'r', x: 24, y: 24, w: 52, h: 56, rx: 3, f: p.main },
    { t: 'r', x: 30, y: 24, w: 46, h: 56, rx: 2, f: p.soft },
    { t: 'r', x: 48, y: 24, w: 6, h: 56, f: p.accent },
    { t: 'ln', x1: 36, y1: 36, x2: 46, y2: 36, s: p.detail, sw: 1.4 },
    { t: 'ln', x1: 58, y1: 36, x2: 70, y2: 36, s: p.detail, sw: 1.4 },
    { t: 'ln', x1: 36, y1: 44, x2: 46, y2: 44, s: p.alt, sw: 1.4 },
  ],
  quill: (p) => [
    { t: 'p', d: 'M30 78 C40 50 58 30 74 18 C60 36 58 48 62 58 C50 52 40 62 30 78 Z', f: p.main },
    { t: 'p', d: 'M30 78 L22 90', f: none, s: p.detail, sw: 2 },
    { t: 'ln', x1: 48, y1: 48, x2: 60, y2: 36, s: p.alt, sw: 1.2 },
  ],
  envelope: (p) => [
    { t: 'r', x: 16, y: 30, w: 68, h: 44, rx: 4, f: p.main },
    { t: 'p', d: 'M16 30 L50 56 L84 30', f: p.alt },
    { t: 'p', d: 'M16 74 L40 52', f: none, s: p.detail, sw: 1.4 },
    { t: 'p', d: 'M84 74 L60 52', f: none, s: p.detail, sw: 1.4 },
    heart(50, 40, 6, p.accent),
  ],
  mug: (p) => [
    { t: 'p', d: 'M28 36 H66 V68 Q66 82 48 82 Q28 82 28 68 Z', f: p.main },
    { t: 'p', d: 'M66 46 H74 Q86 46 86 58 Q86 70 74 70 H66', f: none, s: p.detail, sw: 4 },
    { t: 'e', cx: 48, cy: 36, rx: 19, ry: 5, f: p.alt },
    { t: 'p', d: 'M40 24 Q44 16 48 24', f: none, s: p.soft, sw: 1.5 },
    { t: 'p', d: 'M52 22 Q56 14 60 22', f: none, s: p.soft, sw: 1.5 },
  ],
  key: (p) => [
    { t: 'c', cx: 36, cy: 40, r: 14, f: none, s: p.main, sw: 6 },
    { t: 'c', cx: 36, cy: 40, r: 5, f: p.soft },
    { t: 'r', x: 48, y: 36, w: 34, h: 8, rx: 2, f: p.main },
    { t: 'r', x: 68, y: 44, w: 6, h: 10, f: p.accent },
    { t: 'r', x: 78, y: 44, w: 6, h: 8, f: p.accent },
  ],
  shell: (p) => {
    const nodes: DrawNode[] = [{ t: 'p', d: 'M50 82 C20 70 18 36 50 20 C82 36 80 70 50 82 Z', f: p.main }];
    for (let i = 0; i < 5; i += 1) {
      nodes.push({ t: 'p', d: `M50 80 C${30 + i * 4} 60 ${28 + i * 8} 40 50 24`, f: none, s: p.detail, sw: 1.2 });
    }
    return nodes;
  },
  fish: (p) => [
    { t: 'e', cx: 46, cy: 52, rx: 24, ry: 16, f: p.main },
    { t: 'pg', pts: '68,52 88,36 88,68', f: p.alt },
    { t: 'c', cx: 36, cy: 48, r: 3, f: p.detail },
    { t: 'c', cx: 37, cy: 47, r: 1, f: '#fff' },
    { t: 'p', d: 'M28 52 Q40 58 54 52', f: none, s: p.accent, sw: 1.5 },
  ],
  starfish: (p) => [
    { t: 'pg', pts: starPts(50, 52, 32, 5, 0.42), f: p.main },
    ...face(50, 54, p.detail, p.accent),
  ],
  whale: (p) => [
    { t: 'p', d: 'M16 58 Q30 30 62 40 Q86 48 84 64 Q60 78 24 70 Q12 68 16 58 Z', f: p.main },
    { t: 'e', cx: 40, cy: 66, rx: 14, ry: 8, f: p.alt },
    { t: 'c', cx: 68, cy: 50, r: 2.4, f: p.detail },
    { t: 'p', d: 'M48 36 Q52 22 58 30', f: none, s: p.soft, sw: 2 },
    { t: 'c', cx: 56, cy: 20, r: 3, f: p.soft, o: 0.8 },
  ],
  wave: (p) => [
    { t: 'p', d: 'M8 60 Q22 40 36 60 T64 60 T92 60', f: none, s: p.main, sw: 6 },
    { t: 'p', d: 'M8 74 Q22 56 36 74 T64 74 T92 74', f: none, s: p.accent, sw: 4 },
  ],
  jelly: (p) => [
    { t: 'p', d: 'M22 58 Q22 28 50 28 Q78 28 78 58 Z', f: p.main, o: 0.9 },
    { t: 'p', d: 'M30 58 Q34 80 30 90', f: none, s: p.alt, sw: 2 },
    { t: 'p', d: 'M44 58 Q48 84 42 94', f: none, s: p.accent, sw: 2 },
    { t: 'p', d: 'M58 58 Q54 82 60 92', f: none, s: p.alt, sw: 2 },
    { t: 'p', d: 'M70 58 Q74 78 68 88', f: none, s: p.accent, sw: 2 },
    { t: 'c', cx: 40, cy: 48, r: 3, f: p.detail },
    { t: 'c', cx: 58, cy: 48, r: 3, f: p.detail },
    { t: 'p', d: 'M44 56 Q50 60 56 56', f: none, s: p.detail, sw: 1.4 },
  ],
  boba: (p) => [
    { t: 'p', d: 'M32 30 H68 L62 82 Q50 90 38 82 Z', f: p.soft },
    { t: 'p', d: 'M36 48 H64 L60 80 Q50 86 40 80 Z', f: p.main },
    { t: 'c', cx: 44, cy: 70, r: 3, f: p.detail },
    { t: 'c', cx: 54, cy: 74, r: 3, f: p.detail },
    { t: 'c', cx: 48, cy: 64, r: 2.4, f: p.detail },
    { t: 'r', x: 58, y: 14, w: 6, h: 28, rx: 2, f: p.accent, rot: 18 },
    { t: 'e', cx: 50, cy: 30, rx: 18, ry: 4, f: p.alt },
  ],
  cake: (p) => [
    { t: 'r', x: 22, y: 48, w: 56, h: 28, rx: 6, f: p.main },
    { t: 'r', x: 28, y: 36, w: 44, h: 16, rx: 6, f: p.alt },
    { t: 'p', d: 'M28 44 Q36 38 44 44 T60 44 T72 44', f: none, s: p.soft, sw: 2 },
    { t: 'c', cx: 50, cy: 30, r: 5, f: p.accent },
    { t: 'r', x: 48, y: 22, w: 4, h: 8, f: p.detail },
  ],
  cookie: (p) => [
    { t: 'c', cx: 50, cy: 52, r: 30, f: p.main },
    { t: 'c', cx: 38, cy: 44, r: 4, f: p.detail },
    { t: 'c', cx: 58, cy: 42, r: 3.5, f: p.detail },
    { t: 'c', cx: 62, cy: 58, r: 4, f: p.detail },
    { t: 'c', cx: 44, cy: 62, r: 3, f: p.detail },
    { t: 'c', cx: 52, cy: 50, r: 2.4, f: p.accent },
  ],
  scoop: (p) => [
    { t: 'pg', pts: '36,78 50,42 64,78', f: p.accent },
    { t: 'c', cx: 50, cy: 40, r: 16, f: p.main },
    { t: 'c', cx: 38, cy: 48, r: 12, f: p.alt },
    { t: 'c', cx: 44, cy: 34, r: 3, f: '#fff', o: 0.5 },
    { t: 'p', d: 'M46 70 L54 70', f: none, s: p.soft, sw: 1.4 },
  ],
  macaron: (p) => [
    { t: 'e', cx: 50, cy: 42, rx: 26, ry: 14, f: p.main },
    { t: 'e', cx: 50, cy: 64, rx: 26, ry: 14, f: p.main },
    { t: 'r', x: 26, y: 48, w: 48, h: 10, rx: 3, f: p.accent },
    { t: 'e', cx: 38, cy: 38, rx: 6, ry: 3, f: '#fff', o: 0.35 },
  ],
  crystal: (p) => [
    { t: 'pg', pts: '50,12 78,40 64,88 36,88 22,40', f: p.main, s: p.detail, sw: 2 },
    { t: 'p', d: 'M50 12 L50 88 M22 40 H78 M36 88 L50 40 L64 88', f: none, s: p.alt, sw: 1.3 },
  ],
  crown: (p) => [
    { t: 'p', d: 'M16 68 L28 36 L42 58 L50 28 L58 58 L72 36 L84 68 Z', f: p.main },
    { t: 'c', cx: 28, cy: 32, r: 4, f: p.accent },
    { t: 'c', cx: 50, cy: 24, r: 4, f: p.accent },
    { t: 'c', cx: 72, cy: 32, r: 4, f: p.accent },
    { t: 'r', x: 16, y: 68, w: 68, h: 10, rx: 2, f: p.alt },
  ],
  gem: (p) => [
    { t: 'pg', pts: '50,18 74,40 50,84 26,40', f: p.main, s: p.detail, sw: 2 },
    { t: 'p', d: 'M26 40 H74 L50 18 Z', f: p.alt, o: 0.85 },
    { t: 'p', d: 'M50 18 L50 84', f: none, s: p.soft, sw: 1.2 },
  ],
  comet: (p) => [
    { t: 'p', d: 'M78 30 C40 36 22 58 18 78 C40 62 58 58 78 30 Z', f: p.alt },
    { t: 'c', cx: 74, cy: 32, r: 12, f: p.main },
    { t: 'c', cx: 70, cy: 28, r: 4, f: '#fff', o: 0.6 },
  ],
  planet: (p) => [
    { t: 'c', cx: 50, cy: 52, r: 22, f: p.main },
    { t: 'e', cx: 50, cy: 52, rx: 36, ry: 10, f: none, s: p.accent, sw: 3, rot: -18 },
    { t: 'c', cx: 42, cy: 46, r: 4, f: p.alt },
    { t: 'c', cx: 58, cy: 58, r: 3, f: p.alt },
  ],
  daisy: (p) => {
    const nodes: DrawNode[] = [];
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      nodes.push({ t: 'e', cx: 50 + Math.cos(a) * 16, cy: 48 + Math.sin(a) * 16, rx: 7, ry: 12, f: p.soft, rot: (a * 180) / Math.PI + 90 });
    }
    nodes.push({ t: 'c', cx: 50, cy: 48, r: 8, f: p.accent }, { t: 'p', d: 'M50 64 L50 88', f: none, s: p.detail, sw: 2 });
    return nodes;
  },
  tulip: (p) => [
    { t: 'p', d: 'M50 58 C34 50 30 30 42 26 C46 36 50 36 50 36 C50 36 54 36 58 26 C70 30 66 50 50 58 Z', f: p.main },
    { t: 'p', d: 'M50 36 C50 36 50 48 50 58', f: none, s: p.alt, sw: 1.4 },
    { t: 'p', d: 'M50 58 L50 88', f: none, s: p.detail, sw: 2 },
    { t: 'e', cx: 64, cy: 74, rx: 10, ry: 5, f: p.accent, rot: 40 },
  ],
  anchor: (p) => [
    { t: 'c', cx: 50, cy: 26, r: 8, f: none, s: p.main, sw: 4 },
    { t: 'ln', x1: 50, y1: 34, x2: 50, y2: 78, s: p.main, sw: 4 },
    { t: 'ln', x1: 32, y1: 48, x2: 68, y2: 48, s: p.main, sw: 4 },
    { t: 'p', d: 'M50 78 C50 78 28 78 26 62 M50 78 C50 78 72 78 74 62', f: none, s: p.accent, sw: 4 },
  ],
  coral: (p) => [
    { t: 'p', d: 'M50 88 C50 70 50 64 50 50', f: none, s: p.main, sw: 6 },
    { t: 'p', d: 'M50 70 C36 60 30 48 34 36', f: none, s: p.accent, sw: 5 },
    { t: 'p', d: 'M50 64 C66 56 72 44 66 32', f: none, s: p.alt, sw: 5 },
    { t: 'c', cx: 34, cy: 34, r: 5, f: p.main },
    { t: 'c', cx: 66, cy: 30, r: 5, f: p.accent },
    { t: 'c', cx: 50, cy: 46, r: 4, f: p.alt },
  ],
  seahorse: (p) => [
    { t: 'p', d: 'M58 22 C74 22 76 42 62 46 C78 52 70 78 52 74 C40 86 28 70 40 62 C28 58 32 40 48 40 C40 30 46 22 58 22 Z', f: p.main },
    { t: 'c', cx: 60, cy: 30, r: 2, f: p.detail },
    { t: 'e', cx: 46, cy: 78, rx: 8, ry: 4, f: p.accent },
  ],
  riceball: (p) => [
    { t: 'pg', pts: '50,18 82,78 18,78', f: p.main },
    { t: 'r', x: 40, y: 48, w: 20, h: 22, rx: 2, f: p.detail },
    { t: 'p', d: 'M22 70 H78', f: none, s: p.alt, sw: 2 },
  ],
  pudding: (p) => [
    { t: 'p', d: 'M24 46 H76 L70 78 Q50 88 30 78 Z', f: p.main },
    { t: 'e', cx: 50, cy: 46, rx: 26, ry: 10, f: p.accent },
    { t: 'e', cx: 50, cy: 44, rx: 16, ry: 5, f: p.alt },
    { t: 'c', cx: 62, cy: 36, r: 3, f: p.accent },
  ],
  specs: (p) => [
    { t: 'c', cx: 34, cy: 50, r: 16, f: none, s: p.main, sw: 4 },
    { t: 'c', cx: 68, cy: 50, r: 16, f: none, s: p.main, sw: 4 },
    { t: 'p', d: 'M50 50 H52', f: none, s: p.detail, sw: 3 },
    { t: 'p', d: 'M18 46 H22 M82 46 H78', f: none, s: p.accent, sw: 3 },
  ],
  bottle: (p) => [
    { t: 'r', x: 40, y: 18, w: 20, h: 14, rx: 2, f: p.detail },
    { t: 'p', d: 'M42 32 H58 L64 48 V80 Q50 90 36 80 V48 Z', f: p.main },
    { t: 'r', x: 38, y: 56, w: 24, h: 16, f: p.accent },
    { t: 'c', cx: 46, cy: 64, r: 2, f: p.soft },
  ],
  clip: (p) => [
    { t: 'p', d: 'M40 20 H62 V70 Q62 86 48 86 Q34 86 34 70 V32 Q34 26 42 26 H54', f: none, s: p.main, sw: 4 },
  ],
  cupcake: (p) => [
    { t: 'p', d: 'M30 52 L24 82 H76 L70 52 Z', f: p.alt },
    { t: 'p', d: 'M32 52 Q40 60 48 52 T64 52 T70 52', f: none, s: p.soft, sw: 1.5 },
    { t: 'c', cx: 50, cy: 42, r: 16, f: p.main },
    { t: 'c', cx: 40, cy: 46, r: 10, f: p.accent },
    { t: 'c', cx: 50, cy: 26, r: 4, f: p.detail },
  ],
  flame: (p) => [
    { t: 'p', d: 'M50 12 C68 32 78 40 70 62 C84 50 86 78 50 90 C14 78 20 48 34 60 C28 40 36 28 50 12 Z', f: p.main },
    { t: 'p', d: 'M50 46 C58 56 60 66 50 78 C40 66 42 56 50 46 Z', f: p.accent },
  ],
  disc: (p) => [
    { t: 'c', cx: 50, cy: 50, r: 32, f: p.main },
    { t: 'c', cx: 50, cy: 50, r: 22, f: none, s: p.alt, sw: 6 },
    { t: 'c', cx: 50, cy: 50, r: 8, f: p.soft },
    { t: 'c', cx: 50, cy: 50, r: 3, f: p.detail },
    { t: 'e', cx: 38, cy: 36, rx: 8, ry: 4, f: '#fff', o: 0.35, rot: -30 },
  ],
  phone: (p) => [
    { t: 'r', x: 30, y: 18, w: 40, h: 28, rx: 6, f: p.main },
    { t: 'r', x: 34, y: 40, w: 32, h: 40, rx: 4, f: p.alt },
    { t: 'r', x: 40, y: 48, w: 20, h: 16, rx: 2, f: p.accent },
    { t: 'c', cx: 50, cy: 72, r: 3, f: p.detail },
    { t: 'r', x: 44, y: 22, w: 12, h: 3, rx: 1, f: p.soft },
  ],
  alien: (p) => [
    { t: 'e', cx: 50, cy: 52, rx: 26, ry: 30, f: p.main },
    { t: 'e', cx: 38, cy: 52, rx: 8, ry: 11, f: p.soft },
    { t: 'e', cx: 62, cy: 52, rx: 8, ry: 11, f: p.soft },
    { t: 'e', cx: 38, cy: 54, rx: 3, ry: 5, f: p.detail },
    { t: 'e', cx: 62, cy: 54, rx: 3, ry: 5, f: p.detail },
    { t: 'p', d: 'M44 70 Q50 74 56 70', f: none, s: p.detail, sw: 1.5 },
    { t: 'c', cx: 28, cy: 36, r: 4, f: p.accent },
    { t: 'c', cx: 74, cy: 40, r: 3, f: p.accent },
  ],
  tape: (p) => [
    { t: 'r', x: 14, y: 36, w: 72, h: 28, rx: 4, f: p.main, rot: -8 },
    { t: 'r', x: 40, y: 40, w: 18, h: 18, rx: 2, f: p.soft, o: 0.55, rot: -8 },
  ],
  ribbon: (p) => [
    { t: 'p', d: 'M10 46 H70 L80 36 V56 L70 46', f: p.main },
    { t: 'p', d: 'M10 46 L20 36 V56 Z', f: p.alt },
    { t: 'ln', x1: 28, y1: 46, x2: 62, y2: 46, s: p.soft, sw: 2 },
  ],
  acorn: (p) => [
    { t: 'e', cx: 50, cy: 40, rx: 22, ry: 12, f: p.detail },
    { t: 'p', d: 'M32 44 Q50 86 68 44 Z', f: p.main },
    { t: 'r', x: 46, y: 22, w: 8, h: 10, rx: 2, f: p.accent },
    { t: 'ln', x1: 34, y1: 40, x2: 66, y2: 40, s: p.alt, sw: 1.4 },
  ],
  pie: (p) => [
    { t: 'p', d: 'M18 48 A32 32 0 0 0 82 48 L74 78 Q50 90 26 78 Z', f: p.main },
    { t: 'p', d: 'M18 48 Q50 28 82 48', f: p.alt },
    { t: 'p', d: 'M34 50 L42 66 M50 46 L50 70 M66 50 L58 66', f: none, s: p.detail, sw: 1.5 },
  ],
  pearl: (p) => [
    { t: 'p', d: 'M20 70 Q20 30 50 28 Q80 30 80 70 Z', f: p.alt },
    { t: 'c', cx: 50, cy: 58, r: 12, f: p.soft },
    { t: 'c', cx: 46, cy: 54, r: 3, f: '#fff', o: 0.8 },
    { t: 'c', cx: 36, cy: 62, r: 5, f: p.main, o: 0.35 },
    { t: 'c', cx: 64, cy: 60, r: 4, f: p.accent, o: 0.4 },
  ],
};

export function drawArt(key: ArtKey, colors: Palette): DrawNode[] {
  return art[key](colors);
}
