import { makeMutable } from 'react-native-reanimated';

/** Set while a sticker, photo, or note is dragging so the page curl does not take that touch. */
export const decorationDrag = makeMutable(0);

let pageScroll: ((enabled: boolean) => void) | null = null;
let scrollHolds = 0;

/** The open page registers this so a sticker, photo, note, tag, or mood press can hold the scroll. */
export function bindPageScroll(fn: ((enabled: boolean) => void) | null) {
  pageScroll = fn;
  if (fn) fn(scrollHolds === 0);
}

/** Several gestures can hold the page at once. It scrolls again only when every hold lets go. */
export function holdPage(held: boolean) {
  scrollHolds = Math.max(0, scrollHolds + (held ? 1 : -1));
  pageScroll?.(scrollHolds === 0);
}

export function holdDecoration(held: boolean) {
  decorationDrag.value = held ? 1 : 0;
  holdPage(held);
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
