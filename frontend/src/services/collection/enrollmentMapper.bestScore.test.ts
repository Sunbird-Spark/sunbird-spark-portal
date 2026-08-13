import { describe, it, expect } from 'vitest';
import { getContentAttemptInfoMap } from './enrollmentMapper';
import type { ContentStateItem } from '../../types/collectionTypes';

describe('getContentAttemptInfoMap — bestScore extraction', () => {
  it('extracts bestScore from camelCase fields (SelfAssess path)', () => {
    const list: ContentStateItem[] = [
      { contentId: 'c1', score: [{ totalScore: 8, totalMaxScore: 10 }] },
    ];
    const result = getContentAttemptInfoMap(list);
    expect(result['c1']?.bestScore).toEqual({ totalScore: 8, totalMaxScore: 10 });
  });

  it('extracts bestScore from snake_case fields (QuestionSet path)', () => {
    const list: ContentStateItem[] = [
      { contentId: 'c1', score: [{ total_score: 5, total_max_score: 10 }] },
    ];
    const result = getContentAttemptInfoMap(list);
    expect(result['c1']?.bestScore).toEqual({ totalScore: 5, totalMaxScore: 10 });
  });

  it('prefers camelCase over snake_case when both present', () => {
    const list: ContentStateItem[] = [
      { contentId: 'c1', score: [{ totalScore: 9, totalMaxScore: 10, total_score: 3, total_max_score: 10 }] },
    ];
    const result = getContentAttemptInfoMap(list);
    expect(result['c1']?.bestScore?.totalScore).toBe(9);
  });

  it('picks the attempt with the highest score as bestScore', () => {
    const list: ContentStateItem[] = [
      { contentId: 'c1', score: [
        { total_score: 4, total_max_score: 10 },
        { total_score: 9, total_max_score: 10 },
        { total_score: 6, total_max_score: 10 },
      ]},
    ];
    const result = getContentAttemptInfoMap(list);
    expect(result['c1']?.bestScore?.totalScore).toBe(9);
  });

  it('sets no bestScore when score items lack numeric fields', () => {
    const list: ContentStateItem[] = [
      { contentId: 'c1', score: [{ attempt_id: 'abc' }] },
    ];
    const result = getContentAttemptInfoMap(list);
    expect(result['c1']?.bestScore).toBeUndefined();
  });
});
