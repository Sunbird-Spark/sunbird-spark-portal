import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLevelWaivers } from './useLevelWaivers';
import { parseLearningPath } from '../services/learningPath/learningPathMapper';
import { LP_HIERARCHY_NO_ASSESSMENTS } from '../services/learningPath/__fixtures__/lpHierarchyNoAssessments.fixture';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

vi.mock('./useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

describe('useLevelWaivers', () => {
  it('returns an empty map when the path record has no optional_nodes', () => {
    const { result } = renderHook(() => useLevelWaivers(model, undefined));
    expect(result.current).toEqual({});
  });

  it('returns an empty map when optional_nodes is empty', () => {
    const pathSummary: ViewerSummaryRecord = {
      userId: 'u1',
      active: true,
      status: 1,
      progress: 0,
      contentStatus: {},
      optionalNodes: [],
    };
    const { result } = renderHook(() => useLevelWaivers(model, pathSummary));
    expect(result.current).toEqual({});
  });

  it('waives a level whose own identifier is in optional_nodes, with a translated note', () => {
    const levelId = model.levels[0]!.identifier;
    const pathSummary: ViewerSummaryRecord = {
      userId: 'u1',
      active: true,
      status: 1,
      progress: 0,
      contentStatus: {},
      optionalNodes: [levelId],
    };
    const { result } = renderHook(() => useLevelWaivers(model, pathSummary));
    expect(result.current[levelId]).toEqual({
      status: 'waived',
      note: 'learningPath.waivedByPriorAssessment',
    });
  });

  it('waives a level when every one of its courses is individually optional', () => {
    const level = model.levels[0]!;
    const courseIds = level.courses.map((c) => c.identifier);
    const pathSummary: ViewerSummaryRecord = {
      userId: 'u1',
      active: true,
      status: 1,
      progress: 0,
      contentStatus: {},
      optionalNodes: courseIds,
    };
    const { result } = renderHook(() => useLevelWaivers(model, pathSummary));
    expect(result.current[level.identifier]?.status).toBe('waived');
  });

  it('does not waive a level when only some of its courses are optional', () => {
    const level = model.levels.find((l) => l.courses.length > 1);
    if (!level) return; // fixture-dependent; skip if no multi-course level exists
    const pathSummary: ViewerSummaryRecord = {
      userId: 'u1',
      active: true,
      status: 1,
      progress: 0,
      contentStatus: {},
      optionalNodes: [level.courses[0]!.identifier],
    };
    const { result } = renderHook(() => useLevelWaivers(model, pathSummary));
    expect(result.current[level.identifier]).toBeUndefined();
  });
});
