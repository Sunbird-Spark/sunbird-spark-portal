import { describe, it, expect, beforeEach } from 'vitest';
import { recordAssessmentScore, getStoredAssessmentScore, getAllStoredForCollection } from './assessmentScoreStore';

const STORAGE_KEY = 'lp.assessmentScores.v1';

describe('assessmentScoreStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records a first attempt as-is', () => {
    const result = recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 5, maxScore: 10 });
    expect(result).toEqual({ score: 5, maxScore: 10, attempts: 1 });
    expect(getStoredAssessmentScore('user_1', 'lp_1', 'leaf_1')).toEqual(result);
  });

  // A weaker retry must never lower a learner's best score.
  it('keeps the higher score across attempts and increments the attempt count', () => {
    recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 9, maxScore: 10 });
    const second = recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 4, maxScore: 10 });
    expect(second).toEqual({ score: 9, maxScore: 10, attempts: 2 });
  });

  it('replaces the score when a later attempt scores higher', () => {
    recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 4, maxScore: 10 });
    const second = recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 9, maxScore: 10 });
    expect(second.score).toBe(9);
  });

  // A QUML_SUMMARY-only submission can report a 0 max; a known real max must survive it.
  it('keeps a known non-zero max when a later submission reports 0', () => {
    recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 4, maxScore: 10 });
    const second = recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 6, maxScore: 0 });
    expect(second.maxScore).toBe(10);
  });

  it('survives a reload - reads back from the same localStorage-backed key', () => {
    recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 7, maxScore: 10 });
    // Simulate a reload: no in-memory state carried over, just re-read from storage.
    expect(getStoredAssessmentScore('user_1', 'lp_1', 'leaf_1')).toEqual({ score: 7, maxScore: 10, attempts: 1 });
  });

  it('keeps scores for different content/collection/user separate', () => {
    recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 1, maxScore: 2 });
    recordAssessmentScore('user_1', 'lp_1', 'leaf_2', { score: 3, maxScore: 4 });
    recordAssessmentScore('user_1', 'lp_2', 'leaf_1', { score: 5, maxScore: 6 });
    recordAssessmentScore('user_2', 'lp_1', 'leaf_1', { score: 7, maxScore: 8 });

    expect(getStoredAssessmentScore('user_1', 'lp_1', 'leaf_1')).toEqual({ score: 1, maxScore: 2, attempts: 1 });
    expect(getStoredAssessmentScore('user_1', 'lp_1', 'leaf_2')).toEqual({ score: 3, maxScore: 4, attempts: 1 });
    expect(getStoredAssessmentScore('user_1', 'lp_2', 'leaf_1')).toEqual({ score: 5, maxScore: 6, attempts: 1 });
    expect(getStoredAssessmentScore('user_2', 'lp_1', 'leaf_1')).toEqual({ score: 7, maxScore: 8, attempts: 1 });
  });

  it('returns undefined for a content that was never recorded', () => {
    expect(getStoredAssessmentScore('user_1', 'lp_1', 'leaf_unknown')).toBeUndefined();
  });

  describe('getAllStoredForCollection', () => {
    it('returns every entry for one user/collection, keyed by leaf contentId', () => {
      recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 1, maxScore: 2 });
      recordAssessmentScore('user_1', 'lp_1', 'leaf_2', { score: 3, maxScore: 4 });
      recordAssessmentScore('user_1', 'lp_2', 'leaf_1', { score: 9, maxScore: 9 });

      expect(getAllStoredForCollection('user_1', 'lp_1')).toEqual({
        leaf_1: { score: 1, maxScore: 2, attempts: 1 },
        leaf_2: { score: 3, maxScore: 4, attempts: 1 },
      });
    });

    it('returns an empty map when nothing is stored for that collection', () => {
      expect(getAllStoredForCollection('user_1', 'lp_none')).toEqual({});
    });
  });

  it('degrades to no stored score on corrupt storage rather than throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(() => getStoredAssessmentScore('user_1', 'lp_1', 'leaf_1')).not.toThrow();
    expect(getStoredAssessmentScore('user_1', 'lp_1', 'leaf_1')).toBeUndefined();
  });

  it('degrades gracefully when storage holds a non-object JSON value', () => {
    localStorage.setItem(STORAGE_KEY, '"just a string"');
    expect(getAllStoredForCollection('user_1', 'lp_1')).toEqual({});
  });

  it('does not throw when localStorage is absent (private browsing, etc.)', () => {
    const original = globalThis.localStorage;
    // @ts-expect-error - simulate an environment where localStorage access throws.
    delete globalThis.localStorage;
    try {
      expect(() => recordAssessmentScore('user_1', 'lp_1', 'leaf_1', { score: 1, maxScore: 2 })).not.toThrow();
      expect(() => getStoredAssessmentScore('user_1', 'lp_1', 'leaf_1')).not.toThrow();
    } finally {
      globalThis.localStorage = original;
    }
  });
});
