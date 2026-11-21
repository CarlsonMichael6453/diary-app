import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MOODS } from '../src/data/moods';
import { bindScrollPin, wheelShouldScrollList } from '../src/logic/menuScroll';

describe('mood and tag menus', () => {
  it('includes a fired-up mood', () => {
    const fired = MOODS.find((mood) => mood.id === 'fired');
    assert.ok(fired);
    assert.equal(fired?.emoji, '🔥');
    assert.equal(fired?.label, 'Fired up');
  });

  it('pins the page and puts the scroll position back', () => {
    const listeners = new Map<string, () => void>();
    const node = {
      scrollTop: 120,
      style: { overflowY: 'auto' },
      addEventListener(type: string, listener: () => void) {
        listeners.set(type, listener);
      },
      removeEventListener(type: string) {
        listeners.delete(type);
      },
    };
    const release = bindScrollPin(node);
    node.scrollTop = 400;
    listeners.get('scroll')?.();
    assert.equal(node.scrollTop, 120);
    node.scrollTop = 80;
    release();
    assert.equal(node.scrollTop, 120);
    assert.equal(listeners.has('scroll'), false);
  });

  it('scrolls the menu list until it hits an edge', () => {
    const list = { scrollTop: 20, scrollHeight: 400, clientHeight: 160 };
    assert.equal(wheelShouldScrollList(list, 10), true);
    assert.equal(wheelShouldScrollList(list, -10), true);
    list.scrollTop = 0;
    assert.equal(wheelShouldScrollList(list, -10), false);
    list.scrollTop = 240;
    assert.equal(wheelShouldScrollList(list, 10), false);
    assert.equal(wheelShouldScrollList({ scrollTop: 0, scrollHeight: 100, clientHeight: 160 }, 10), false);
  });
});
