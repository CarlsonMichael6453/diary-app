/** Diameter of the soft-curl cylinder, as a fraction of the page width. */
export const CURL_DIAMETER = 0.18;

export type CurlLayout = {
  side: 'next' | 'prev' | 'flat';
  /** Left edge of the page underneath, in pixels. */
  coverLeft: number;
  coverWidth: number;
  /** Left edge of the cylinder. */
  curlLeft: number;
  curlWidth: number;
  /** Shadow on the flat page, just before it enters the fold. */
  shadeLeft: number;
  shadeWidth: number;
  /** Soft shadow cast on the page under the cylinder. */
  dropLeft: number;
  dropWidth: number;
};

/** Maps a drag progress (-1 next, +1 previous) onto the curl. */
export function curlLayout(progress: number, width: number): CurlLayout {
  'worklet';
  const w = Math.max(0, width);
  const diameter = w * CURL_DIAMETER;
  const empty: CurlLayout = {
    side: 'flat',
    coverLeft: 0,
    coverWidth: 0,
    curlLeft: w,
    curlWidth: 0,
    shadeLeft: 0,
    shadeWidth: 0,
    dropLeft: 0,
    dropWidth: 0,
  };
  if (w < 2) return empty;
  const clamped = Math.max(-1, Math.min(1, progress));
  const amount = Math.abs(clamped);
  if (amount < 0.004) return empty;
  const travel = w + diameter;
  const shade = Math.min(42, diameter);
  const drop = Math.min(72, diameter * 2.2);
  if (clamped < 0) {
    const curlLeft = w - amount * travel;
    const coverLeft = Math.max(0, curlLeft);
    return {
      side: 'next',
      coverLeft,
      coverWidth: Math.max(0, w - coverLeft),
      curlLeft,
      curlWidth: diameter,
      shadeLeft: curlLeft - shade,
      shadeWidth: shade,
      dropLeft: curlLeft + diameter * 0.72,
      dropWidth: drop,
    };
  }
  const curlRight = -diameter + amount * travel;
  const curlLeft = curlRight - diameter;
  return {
    side: 'prev',
    coverLeft: 0,
    coverWidth: Math.max(0, Math.min(w, curlRight)),
    curlLeft,
    curlWidth: diameter,
    shadeLeft: curlRight,
    shadeWidth: shade,
    dropLeft: curlRight,
    dropWidth: drop,
  };
}
