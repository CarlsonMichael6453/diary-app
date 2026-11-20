import { makeMutable } from 'react-native-reanimated';

/** Set while a sticker, photo, or note is dragging so the page curl does not take that touch. */
export const decorationDrag = makeMutable(0);

export function holdDecoration(held: boolean) {
  decorationDrag.value = held ? 1 : 0;
}
