export const PAGE_TEXT_ID = 'page-text';

export type LayerMove = 'front' | 'back' | 'forward' | 'backward';

export type StackItem = { id: string; z: number };

export function reorderStack(items: StackItem[], id: string, move: LayerMove): StackItem[] {
  const sorted = [...items].sort((a, b) => a.z - b.z || a.id.localeCompare(b.id));
  const index = sorted.findIndex((item) => item.id === id);
  if (index < 0) return sorted.map((item, order) => ({ ...item, z: order }));
  const next = [...sorted];
  if (move === 'front') {
    const [item] = next.splice(index, 1);
    next.push(item);
  } else if (move === 'back') {
    const [item] = next.splice(index, 1);
    next.unshift(item);
  } else if (move === 'forward' && index < next.length - 1) {
    const swap = next[index + 1];
    next[index + 1] = next[index];
    next[index] = swap;
  } else if (move === 'backward' && index > 0) {
    const swap = next[index - 1];
    next[index - 1] = next[index];
    next[index] = swap;
  }
  return next.map((item, order) => ({ id: item.id, z: order }));
}

export function isBehindText(z: number, textZ: number): boolean {
  return z < textZ;
}
