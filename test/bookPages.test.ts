import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { pageNeighbors } from '../src/logic/bookPages';

const written = [
  { id: 'older', date: '2026-11-15', createdAt: 1 },
  { id: 'newer', date: '2026-11-18', createdAt: 2 },
];

describe('page neighbors', () => {
  it('steps from a written page onto the blank day between entries', () => {
    const { prev, next } = pageNeighbors(written, written[0], '2026-11-18');
    assert.equal(prev, null);
    assert.deepEqual(next, { kind: 'blank', date: '2026-11-16' });
  });

  it('opens a fresh blank page after the last written page', () => {
    const { prev, next } = pageNeighbors(written, written[1], '2026-11-18');
    assert.equal(prev?.kind, 'blank');
    assert.equal(prev?.kind === 'blank' && prev.date, '2026-11-17');
    assert.deepEqual(next, { kind: 'blank', date: '2026-11-19' });
  });

  it('walks blank to blank and back to a written page', () => {
    const gap = { id: 'gap', date: '2026-11-16', createdAt: 9 };
    const forward = pageNeighbors(written, gap, '2026-11-18');
    assert.equal(forward.prev?.kind, 'entry');
    assert.equal(forward.prev?.kind === 'entry' && forward.prev.id, 'older');
    assert.deepEqual(forward.next, { kind: 'blank', date: '2026-11-17' });
    const second = pageNeighbors(written, { id: 'gap2', date: '2026-11-17', createdAt: 10 }, '2026-11-18');
    assert.equal(second.next?.kind, 'entry');
    assert.equal(second.next?.kind === 'entry' && second.next.id, 'newer');
  });

  it('keeps a blank day after today so the last page can still turn forward', () => {
    const today = { id: 'today', date: '2026-11-21', createdAt: 3 };
    const { next } = pageNeighbors(written, today, '2026-11-21');
    assert.deepEqual(next, { kind: 'blank', date: '2026-11-22' });
  });
});
