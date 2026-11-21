import { makeMutable } from 'react-native-reanimated';

/** Set while a sticker, photo, or note is dragging so the page curl does not take that touch. */
export const decorationDrag = makeMutable(0);

export function holdDecoration(held: boolean) {
  decorationDrag.value = held ? 1 : 0;
}

/** Set while a finger is down on a horizontal strip (emojis, stickers, fonts, inks). */
export const stripTouch = makeMutable(0);

export function holdStrip(held: boolean) {
  stripTouch.value = held ? 1 : 0;
}

/** Set for the whole drawing session so a thumb swipe cannot turn the page. */
export const drawingLock = makeMutable(0);

export function holdDrawing(held: boolean) {
  drawingLock.value = held ? 1 : 0;
}
