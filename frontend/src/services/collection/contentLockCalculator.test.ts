import { describe, it, expect } from 'vitest';
import { getLockedContentIds } from './contentLockCalculator';
import type { HierarchyContentNode } from '../../types/collectionTypes';

const COLLECTION_MIME = 'application/vnd.ekstep.content-collection';

function unit(identifier: string, children: HierarchyContentNode[]): HierarchyContentNode {
  return { identifier, mimeType: COLLECTION_MIME, children };
}

function leaf(identifier: string): HierarchyContentNode {
  return { identifier, mimeType: 'application/pdf' };
}

/** Course → Unit-1 [a, b] → Unit-2 [c, d]. Depth-first leaf order: a, b, c, d. */
const courseWithTwoUnits = unit('course', [
  unit('unit-1', [leaf('a'), leaf('b')]),
  unit('unit-2', [leaf('c'), leaf('d')]),
]);

describe('getLockedContentIds', () => {
  it('locks nothing when the hierarchy is null', () => {
    expect(getLockedContentIds(null, { a: 2 }).size).toBe(0);
  });

  it('locks nothing when there is no status map (fails open)', () => {
    // A failed content/state/read, or a creator/mentor who was never given a map.
    // Under-locking briefly is preferred to walling a learner out mid-course.
    expect(getLockedContentIds(courseWithTwoUnits, undefined).size).toBe(0);
  });

  it('leaves only the first content open for a fresh learner', () => {
    const locked = getLockedContentIds(courseWithTwoUnits, {});
    expect([...locked].sort()).toEqual(['b', 'c', 'd']);
  });

  it('unlocks the next content once the current one is complete', () => {
    const locked = getLockedContentIds(courseWithTwoUnits, { a: 2 });
    expect(locked.has('b')).toBe(false);
    expect([...locked].sort()).toEqual(['c', 'd']);
  });

  it('treats in-progress (status 1) as incomplete', () => {
    const locked = getLockedContentIds(courseWithTwoUnits, { a: 1 });
    expect([...locked].sort()).toEqual(['b', 'c', 'd']);
  });

  it('locks nothing when every content is complete', () => {
    const locked = getLockedContentIds(courseWithTwoUnits, { a: 2, b: 2, c: 2, d: 2 });
    expect(locked.size).toBe(0);
  });

  it('continues the sequence across unit boundaries', () => {
    // Finishing the last leaf of unit-1 opens the first leaf of unit-2.
    const locked = getLockedContentIds(courseWithTwoUnits, { a: 2, b: 2 });
    expect(locked.has('c')).toBe(false);
    expect([...locked]).toEqual(['d']);
  });

  it('never locks completed content, even when an earlier item is incomplete', () => {
    // Guards against a course edit reordering content so that an unfinished leaf
    // sits ahead of ones the learner already finished.
    const locked = getLockedContentIds(courseWithTwoUnits, { a: 2, c: 2 });
    expect(locked.has('c')).toBe(false);
    expect([...locked].sort()).toEqual(['d']);
  });

  it('locks nothing in a single-content course', () => {
    const locked = getLockedContentIds(unit('course', [unit('unit-1', [leaf('a')])]), {});
    expect(locked.size).toBe(0);
  });

  it('handles content sitting directly under the course with no unit wrapper', () => {
    const locked = getLockedContentIds(unit('course', [leaf('a'), leaf('b')]), {});
    expect([...locked]).toEqual(['b']);
  });

  it('handles units nested inside units', () => {
    const deep = unit('course', [
      unit('unit-1', [leaf('a'), unit('unit-1-1', [leaf('b'), leaf('c')])]),
      leaf('d'),
    ]);
    const locked = getLockedContentIds(deep, { a: 2, b: 2 });
    expect(locked.has('c')).toBe(false);
    expect([...locked]).toEqual(['d']);
  });

  it('locks nothing when the course has no playable content', () => {
    expect(getLockedContentIds(unit('course', []), {}).size).toBe(0);
  });
});
