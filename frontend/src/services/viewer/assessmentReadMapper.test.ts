import { describe, it, expect } from 'vitest';
import { getAssessmentReadItems, buildAssessmentReadMap } from './assessmentReadMapper';
import type { AssessmentReadResponse } from '../../types/viewerServiceTypes';

describe('getAssessmentReadItems', () => {
  it('reads the live response[] shape (by analogy with /v1/view/read)', () => {
    const response: AssessmentReadResponse = {
      response: [{ contentId: 'do_1', score: 8, max_score: 10 }],
    };
    expect(getAssessmentReadItems(response)).toEqual([{ contentId: 'do_1', score: 8, max_score: 10 }]);
  });

  it('falls back to the spec contents[] shape', () => {
    const response: AssessmentReadResponse = {
      contents: [{ contentId: 'do_1', score: 8, max_score: 10 }],
    };
    expect(getAssessmentReadItems(response)).toEqual([{ contentId: 'do_1', score: 8, max_score: 10 }]);
  });

  it('returns an empty array for null/undefined/empty input', () => {
    expect(getAssessmentReadItems(null)).toEqual([]);
    expect(getAssessmentReadItems(undefined)).toEqual([]);
    expect(getAssessmentReadItems({})).toEqual([]);
  });
});

describe('buildAssessmentReadMap', () => {
  it('keys entries by contentId', () => {
    const response: AssessmentReadResponse = {
      response: [{ contentId: 'do_1', score: 8, max_score: 10, attempts: 2 }],
    };
    expect(buildAssessmentReadMap(response)).toEqual({
      do_1: { contentId: 'do_1', score: 8, maxScore: 10, attempts: 2 },
    });
  });

  it('falls back to identifier (spec field name) when contentId is absent', () => {
    const response: AssessmentReadResponse = {
      contents: [{ identifier: 'do_1', score: 8, max_score: 10 }],
    };
    expect(buildAssessmentReadMap(response)).toEqual({ do_1: { contentId: 'do_1', score: 8, maxScore: 10 } });
  });

  it('omits attempts when not present, and defaults maxScore to 0 when not present', () => {
    const response: AssessmentReadResponse = { response: [{ contentId: 'do_1', score: 8 }] };
    const result = buildAssessmentReadMap(response);
    expect(result.do_1).toEqual({ contentId: 'do_1', score: 8, maxScore: 0 });
    expect(result.do_1).not.toHaveProperty('attempts');
  });

  it('drops items with no id at all', () => {
    const response: AssessmentReadResponse = { response: [{ score: 8, max_score: 10 }] };
    expect(buildAssessmentReadMap(response)).toEqual({});
  });

  it('drops items with a non-numeric score - the live wire shape for this endpoint is unconfirmed', () => {
    const response: AssessmentReadResponse = { response: [{ contentId: 'do_1' }] };
    expect(buildAssessmentReadMap(response)).toEqual({});
  });

  it('returns an empty map for null/undefined/empty input', () => {
    expect(buildAssessmentReadMap(null)).toEqual({});
    expect(buildAssessmentReadMap(undefined)).toEqual({});
    expect(buildAssessmentReadMap({})).toEqual({});
  });
});
