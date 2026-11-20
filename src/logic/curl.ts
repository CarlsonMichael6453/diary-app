/** Width of the paper fold, in pixels. Kept narrow so it reads as an edge, not a tube. */
export const CURL_FOLD = 18;

export type CurlLayout = {
  side: 'next' | 'prev' | 'flat';
  /** The fold line passes through this x. It stays on the finger. */
  foldX: number;
  /** Degrees. Negative lifts the top of the page toward a high finger. */
  angle: number;
  curlLeft: number;
  curlWidth: number;
  coverLeft: number;
  coverWidth: number;
  shadeLeft: number;
  shadeWidth: number;
  dropLeft: number;
  dropWidth: number;
};

/** Tilt so the fold leans toward the finger's height. Center is straight. */
export function foldAngle(fingerY: number, height: number): number {
  'worklet';
  const span = height > 1 ? height : 1;
  const ny = fingerY / span;
  return Math.max(-12, Math.min(12, (ny - 0.5) * 28));
}

/** The curl edge is the finger x. There is no extra smoothing or dead zone here. */
export function curlLayout(fingerX: number, fingerY: number, width: number, height: number, side: 'next' | 'prev' | 'flat'): CurlLayout {
  'worklet';
  const w = Math.max(0, width);
  const diameter = CURL_FOLD;
  const foldX = Math.max(0, Math.min(w, fingerX));
  const angle = foldAngle(fingerY, height);
  const empty: CurlLayout = {
    side: 'flat',
    foldX: w,
    angle: 0,
    curlLeft: w,
    curlWidth: 0,
    coverLeft: 0,
    coverWidth: 0,
    shadeLeft: 0,
    shadeWidth: 0,
    dropLeft: 0,
    dropWidth: 0,
  };
  if (w < 2 || side === 'flat') return empty;
  const shade = Math.min(36, diameter);
  const drop = Math.min(64, diameter * 2);
  if (side === 'next') {
    return {
      side,
      foldX,
      angle,
      curlLeft: foldX - diameter * 0.35,
      curlWidth: diameter,
      coverLeft: foldX,
      coverWidth: Math.max(0, w - foldX),
      shadeLeft: foldX - shade,
      shadeWidth: shade,
      dropLeft: foldX + diameter * 0.45,
      dropWidth: drop,
    };
  }
  return {
    side,
    foldX,
    angle,
    curlLeft: foldX - diameter * 0.65,
    curlWidth: diameter,
    coverLeft: 0,
    coverWidth: foldX,
    shadeLeft: foldX,
    shadeWidth: shade,
    dropLeft: foldX,
    dropWidth: drop,
  };
}
