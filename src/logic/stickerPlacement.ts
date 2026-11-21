/** Keep a sticker on the page, and turn it by dragging or a two-finger twist. */

export function clampStickerPosition(x: number, y: number): { x: number; y: number } {
  const limit = (value: number) => Math.min(0.92, Math.max(0.08, value));
  return { x: limit(x), y: limit(y) };
}

export function normalizeDegrees(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const wrapped = ((value % 360) + 360) % 360;
  return wrapped === 0 ? 0 : wrapped;
}

/** Pull a turn onto a straight angle when the finger is close to one. */
export function snapCardinal(degrees: number, threshold = 7): number {
  const normalized = normalizeDegrees(degrees);
  const cards = [0, 90, 180, 270, 360];
  for (const card of cards) {
    const gap = Math.min(Math.abs(normalized - card), 360 - Math.abs(normalized - card));
    if (gap <= threshold) return card === 360 ? 0 : card;
  }
  return normalized;
}

export function pointerAngle(fromX: number, fromY: number, toX: number, toY: number): number {
  return normalizeDegrees((Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI);
}

export function angleDelta(fromDegrees: number, toDegrees: number): number {
  let delta = toDegrees - fromDegrees;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/** New rotation after the finger moves from startAngle to currentAngle around the sticker. */
export function rotationFromDrag(startRotation: number, startAngle: number, currentAngle: number): number {
  return snapCardinal(normalizeDegrees(startRotation) + angleDelta(startAngle, currentAngle));
}
