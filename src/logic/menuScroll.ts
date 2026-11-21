/** Keep the page still while a mood or tag menu is open, and let the menu list scroll. */

export function bindScrollPin(node: {
  scrollTop: number;
  style: { overflowY: string };
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}): () => void {
  const top = node.scrollTop;
  const keep = () => {
    if (node.scrollTop !== top) node.scrollTop = top;
  };
  node.addEventListener?.('scroll', keep);
  return () => {
    node.removeEventListener?.('scroll', keep);
    node.scrollTop = top;
  };
}

/** True when the wheel should move the menu list instead of the page. */
export function wheelShouldScrollList(
  list: { scrollTop: number; scrollHeight: number; clientHeight: number } | null,
  deltaY: number,
): boolean {
  if (!list || list.scrollHeight <= list.clientHeight + 1) return false;
  if (deltaY < 0 && list.scrollTop <= 0) return false;
  if (deltaY > 0 && list.scrollTop + list.clientHeight >= list.scrollHeight - 1) return false;
  return true;
}

export function closestScroller(start: Element | null): HTMLElement | null {
  let node = start?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    const scrollable = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 4;
    if (scrollable) return node;
    node = node.parentElement;
  }
  return null;
}

let intendedTop: number | null = null;

/** Remember the page position before the menu opens, so a click cannot move it. */
export function rememberMenuScroll(anchor: HTMLElement | null) {
  const scroller = closestScroller(anchor);
  intendedTop = scroller?.scrollTop ?? null;
}

let pins = 0;
let releasePin: (() => void) | null = null;
let guards = false;
let unpinWindow: (() => void) | null = null;

function listFrom(event: Event): HTMLElement | null {
  const target = event.target as Element | null;
  return (target?.closest?.('[data-choice-list="1"]') as HTMLElement | null) ?? null;
}

function onWheel(event: WheelEvent) {
  const list = listFrom(event);
  if (list && wheelShouldScrollList(list, event.deltaY)) return;
  event.preventDefault();
}

function onTouchMove(event: TouchEvent) {
  if (listFrom(event)) return;
  if (event.cancelable) event.preventDefault();
}

function pinWindow(scroller: HTMLElement | null) {
  if (typeof document === 'undefined') return () => {};
  const top = scroller?.scrollTop ?? 0;
  const root = document.scrollingElement as HTMLElement | null;
  const rootTop = root && root !== scroller ? root.scrollTop : 0;
  const pin = () => {
    if (scroller && scroller.scrollTop !== top) scroller.scrollTop = top;
    if (root && root !== scroller && root.scrollTop !== rootTop) root.scrollTop = rootTop;
  };
  document.addEventListener('scroll', pin, true);
  const onFocus = () => {
    pin();
    requestAnimationFrame(pin);
    setTimeout(pin, 50);
  };
  window.addEventListener('focusin', onFocus);
  window.visualViewport?.addEventListener('scroll', pin);
  window.visualViewport?.addEventListener('resize', pin);
  return () => {
    document.removeEventListener('scroll', pin, true);
    window.removeEventListener('focusin', onFocus);
    window.visualViewport?.removeEventListener('scroll', pin);
    window.visualViewport?.removeEventListener('resize', pin);
    pin();
  };
}

function installGuards() {
  if (guards || typeof window === 'undefined') return;
  guards = true;
  window.addEventListener('wheel', onWheel, { capture: true, passive: false });
  window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
}

function removeGuards() {
  if (!guards || typeof window === 'undefined') return;
  guards = false;
  window.removeEventListener('wheel', onWheel, { capture: true });
  window.removeEventListener('touchmove', onTouchMove, { capture: true });
}

/** Pin the page scroller until every open menu has closed. */
export function lockOpenMenu(anchor: HTMLElement | null): () => void {
  if (pins === 0) {
    const scroller = closestScroller(anchor);
    if (scroller && intendedTop != null) scroller.scrollTop = intendedTop;
    if (scroller) releasePin = bindScrollPin(scroller);
    intendedTop = null;
    unpinWindow = pinWindow(scroller);
    installGuards();
  }
  pins += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    pins = Math.max(0, pins - 1);
    if (pins === 0) {
      removeGuards();
      unpinWindow?.();
      unpinWindow = null;
      releasePin?.();
      releasePin = null;
    }
  };
}
