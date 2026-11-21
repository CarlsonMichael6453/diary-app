import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { pageNeighbors } from '../src/logic/bookPages';

const written = [
  { id: 'older', date: '2026-11-15', createdAt: 1 },
  { id: 'newer', date: '2026-11-18', createdAt: 2 },
];

describe('page neighbors', () => {
  it('turns a saved page onto the pages beside it, including the ends', () => {
    assert.deepEqual(pageNeighbors(written, written[0]), { prev: null, next: written[1] });
    assert.deepEqual(pageNeighbors(written, written[1]), { prev: written[0], next: null });
  });

  it('places an unsaved blank page in the date order', () => {
    const blank = { id: 'new', date: '2026-11-21', createdAt: 3 };
    const between = { id: 'gap', date: '2026-11-16', createdAt: 4 };
    assert.deepEqual(pageNeighbors(written, blank), { prev: written[1], next: null });
    assert.deepEqual(pageNeighbors(written, between), { prev: written[0], next: written[1] });
  });
});
