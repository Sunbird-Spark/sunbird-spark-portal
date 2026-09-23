import { describe, it, expect } from 'vitest';
import { getAssessmentInfo, buildAssessmentInfoMap, resolveAssessmentInfo, mergeAssessmentSources } from './learningPathAssessment';
import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';

function summary(assessmentStatus?: ViewerSummaryRecord['assessmentStatus']): ViewerSummaryRecord {
  return {
    userId: 'u1',
    collectionId: 'do_path',
    active: true,
    status: 1,
    progress: 0,
    contentStatus: {},
    ...(assessmentStatus ? { assessmentStatus } : {}),
  };
}

describe('getAssessmentInfo', () => {
  it('resolves an entry keyed by the identifier itself', () => {
    const record = summary({ do_assess: { score: 8, max_score: 10, attempts: 2 } });
    expect(getAssessmentInfo('do_assess', [], record)).toEqual({
      score: 8,
      maxScore: 10,
      attemptCount: 2,
    });
  });

  // Submissions are written keyed by leaf contentId, but callers hold the
  // assessment's course identifier - the leaf fallback is what bridges the two.
  it('falls back to a leaf id when the identifier itself has no entry', () => {
    const record = summary({ do_leaf: { score: 3, max_score: 5 } });
    expect(getAssessmentInfo('do_course', ['do_leaf'], record)).toEqual({ score: 3, maxScore: 5 });
  });

  it('omits attemptCount when the entry carries no attempts', () => {
    const record = summary({ do_leaf: { score: 3, max_score: 5 } });
    expect(getAssessmentInfo('do_leaf', [], record)).not.toHaveProperty('attemptCount');
  });

  it('picks the highest score when several leaves have entries', () => {
    const record = summary({
      do_leaf_a: { score: 4, max_score: 10 },
      do_leaf_b: { score: 9, max_score: 10 },
    });
    expect(getAssessmentInfo('do_course', ['do_leaf_a', 'do_leaf_b'], record)?.score).toBe(9);
  });

  it('returns null when nothing matches', () => {
    const record = summary({ do_other: { score: 1, max_score: 2 } });
    expect(getAssessmentInfo('do_course', ['do_leaf'], record)).toBeNull();
  });

  it('returns null when the record has no assessmentStatus at all', () => {
    expect(getAssessmentInfo('do_assess', ['do_leaf'], summary())).toBeNull();
  });

  it('returns null for an undefined summary', () => {
    expect(getAssessmentInfo('do_assess', [], undefined)).toBeNull();
  });
});

describe('buildAssessmentInfoMap', () => {
  it('maps every entry by contentId', () => {
    const record = summary({
      do_a: { score: 1, max_score: 2, attempts: 1 },
      do_b: { score: 5, max_score: 5 },
    });
    expect(buildAssessmentInfoMap(record)).toEqual({
      do_a: { score: 1, maxScore: 2, attemptCount: 1 },
      do_b: { score: 5, maxScore: 5 },
    });
  });

  it('returns an empty map when assessmentStatus is absent', () => {
    expect(buildAssessmentInfoMap(summary())).toEqual({});
    expect(buildAssessmentInfoMap(undefined)).toEqual({});
  });
});

describe('resolveAssessmentInfo', () => {
  it('resolves against a plain contentId -> info map, same lookup rules as getAssessmentInfo', () => {
    const map = { do_leaf: { score: 3, maxScore: 5 } };
    expect(resolveAssessmentInfo('do_course', ['do_leaf'], map)).toEqual({ score: 3, maxScore: 5 });
  });

  it('returns null when the map has no matching entry', () => {
    expect(resolveAssessmentInfo('do_course', ['do_leaf'], {})).toBeNull();
  });
});

describe('mergeAssessmentSources', () => {
  it('falls back to pathSummary.assessmentStatus when local/server maps are empty', () => {
    const record = summary({ do_leaf: { score: 3, max_score: 5, attempts: 1 } });
    expect(mergeAssessmentSources(record)).toEqual({
      do_leaf: { score: 3, maxScore: 5, attemptCount: 1 },
    });
  });

  // The durable local store survives cache invalidation/reload; pathSummary
  // (in-memory only) does not - so local must win when both have an entry.
  it('lets the local store override pathSummary for the same content', () => {
    const record = summary({ do_leaf: { score: 3, max_score: 5, attempts: 1 } });
    const local = { do_leaf: { score: 9, maxScore: 10, attempts: 3 } };
    expect(mergeAssessmentSources(record, local).do_leaf).toEqual({ score: 9, maxScore: 10, attemptCount: 3 });
  });

  // The server (/v1/assessment/read) is the most authoritative source when it has data.
  it('lets the server map override both local and pathSummary for the same content', () => {
    const record = summary({ do_leaf: { score: 3, max_score: 5, attempts: 1 } });
    const local = { do_leaf: { score: 9, maxScore: 10, attempts: 3 } };
    const server = { do_leaf: { score: 7, maxScore: 10, attempts: 5 } };
    expect(mergeAssessmentSources(record, local, server).do_leaf).toEqual({
      score: 7,
      maxScore: 10,
      attemptCount: 5,
    });
  });

  it('keeps entries that exist in only one source', () => {
    const record = summary({ do_a: { score: 1, max_score: 2 } });
    const local = { do_b: { score: 3, maxScore: 4 } };
    const server = { do_c: { score: 5, maxScore: 6 } };
    expect(mergeAssessmentSources(record, local, server)).toEqual({
      do_a: { score: 1, maxScore: 2 },
      do_b: { score: 3, maxScore: 4 },
      do_c: { score: 5, maxScore: 6 },
    });
  });

  it('handles all sources being empty/undefined', () => {
    expect(mergeAssessmentSources(undefined)).toEqual({});
  });
});
