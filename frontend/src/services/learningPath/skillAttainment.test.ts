import { describe, it, expect } from 'vitest';
import { getAttainedLevels, getGainedSkills } from './skillAttainment';
import type { LevelProgressInfo, LPLevelNode } from '../../types/learningPathTypes';

function level(overrides: Partial<LPLevelNode>): LPLevelNode {
  return { identifier: 'lvl', name: 'Level', index: 0, competencies: [], skills: [], courses: [], ...overrides };
}

function progress(pct: number): LevelProgressInfo {
  return { pct, completed: 0, total: 1, doneCourses: 0 };
}

describe('getAttainedLevels', () => {
  it('returns an empty array for no levels', () => {
    expect(getAttainedLevels([], [])).toEqual([]);
  });

  it('attains a level at 100% progress', () => {
    expect(getAttainedLevels([progress(100), progress(99), progress(0)], ['active', 'active', 'notStarted'])).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('attains a waived or credited level regardless of progress', () => {
    expect(getAttainedLevels([progress(0), progress(0), progress(0)], ['waived', 'credited', 'creditedPending'])).toEqual(
      [true, true, false]
    );
  });

  // The status page reports what was earned, so the policy's unlock gate must not hide a
  // level the learner has actually finished.
  it('ignores the locked status when the level is complete', () => {
    expect(getAttainedLevels([progress(100)], ['locked'])).toEqual([true]);
  });

  it('treats a missing status entry as not attained when progress is incomplete', () => {
    expect(getAttainedLevels([progress(50)], [])).toEqual([false]);
  });
});

describe('getGainedSkills', () => {
  it('returns an empty set for no levels', () => {
    expect(getGainedSkills([], [])).toEqual(new Set());
  });

  it('includes skills only from attained levels', () => {
    const levels = [
      level({ identifier: 'l1', skills: ['a', 'b'] }),
      level({ identifier: 'l2', skills: ['c'] }),
      level({ identifier: 'l3', skills: ['d'] }),
    ];
    expect(getGainedSkills(levels, [true, false, true])).toEqual(new Set(['a', 'b', 'd']));
  });

  it('dedupes skills shared across multiple attained levels', () => {
    const levels = [level({ identifier: 'l1', skills: ['shared', 'a'] }), level({ identifier: 'l2', skills: ['shared', 'b'] })];
    expect(getGainedSkills(levels, [true, true])).toEqual(new Set(['shared', 'a', 'b']));
  });

  it('treats a missing attainment entry as not gained', () => {
    expect(getGainedSkills([level({ identifier: 'l1', skills: ['a'] })], [])).toEqual(new Set());
  });
});
