import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLearningPath } from './useLearningPath';
import { LP_HIERARCHY_NO_ASSESSMENTS } from '../services/learningPath/__fixtures__/lpHierarchyNoAssessments.fixture';
import type { CollectionData } from '../types/collectionTypes';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

const mockCollectionData: CollectionData = {
  id: LP_HIERARCHY_NO_ASSESSMENTS.identifier,
  title: LP_HIERARCHY_NO_ASSESSMENTS.name ?? '',
  lessons: 3,
  image: '',
  units: 2,
  description: '',
  audience: [],
  children: LP_HIERARCHY_NO_ASSESSMENTS.children ?? [],
  hierarchyRoot: LP_HIERARCHY_NO_ASSESSMENTS,
};

let mockUseCollectionData: CollectionData | undefined = mockCollectionData;
let mockSummaryRecords: ViewerSummaryRecord[] = [];
let mockIsAuthenticated = true;

vi.mock('./useCollection', () => ({
  useCollection: () => ({ data: mockUseCollectionData, isLoading: false, isError: false }),
}));

vi.mock('./useViewerSummary', () => ({
  useViewerSummary: () => ({ data: mockSummaryRecords, isLoading: false }),
}));

vi.mock('./useAuthInfo', () => ({
  useIsAuthenticated: () => ({ isAuthenticated: mockIsAuthenticated, isLoading: false }),
}));

const mockEnrollment = { isEnrolled: false, effectiveContextId: undefined };
vi.mock('./useLearningPathEnrollment', () => ({
  useLearningPathEnrollment: () => mockEnrollment,
}));

vi.mock('./useLevelWaivers', () => ({
  useLevelWaivers: () => ({}),
}));

describe('useLearningPath', () => {
  it('parses the hierarchy into a model and reports zero progress when not enrolled', () => {
    mockUseCollectionData = mockCollectionData;
    mockSummaryRecords = [];

    const { result } = renderHook(() => useLearningPath(LP_HIERARCHY_NO_ASSESSMENTS.identifier, undefined));

    expect(result.current.model.levels).toHaveLength(2);
    expect(result.current.progress.pct).toBe(0);
    expect(result.current.levelStatuses).toEqual(['notStarted', 'locked']);
    expect(result.current.resumeTarget).toBeNull();
  });

  it('reports full progress and no locked levels for the known-good, fully-completed account', () => {
    mockUseCollectionData = mockCollectionData;
    mockSummaryRecords = [
      {
        userId: 'u1',
        collectionId: 'do_2146316303263006721126',
        contextId: '0146338062206566400:do_2146316303263006721126',
        active: true,
        status: 2,
        progress: 2,
        completionPercentage: 100,
        contentStatus: { do_21463158442296934411: 2, do_214631592231313408130: 2 },
      },
      {
        userId: 'u1',
        collectionId: 'do_214631618315042816133',
        contextId: '0146338062206566400:do_214631618315042816133',
        active: true,
        status: 2,
        progress: 1,
        completionPercentage: 100,
        contentStatus: { do_214631615408873472110: 2 },
      },
      {
        userId: 'u1',
        collectionId: LP_HIERARCHY_NO_ASSESSMENTS.identifier,
        contextId: '0146338062206566400',
        active: true,
        status: 2,
        progress: 3,
        completionPercentage: 100,
        lastReadContentId: 'do_214631615408873472110',
        contentStatus: {
          do_21463158442296934411: 2,
          do_214631592231313408130: 2,
          do_214631615408873472110: 2,
        },
      },
    ];

    const { result } = renderHook(() => useLearningPath(LP_HIERARCHY_NO_ASSESSMENTS.identifier, undefined));

    expect(result.current.progress.pct).toBe(100);
    expect(result.current.levelStatuses).toEqual(['completed', 'completed']);
    // Resolves to the path record's lastReadContentId (still returned even though the path is fully complete).
    expect(result.current.resumeTarget).toEqual({
      collectionId: 'do_214631618315042816133',
      contentId: 'do_214631615408873472110',
      contextId: '0146338062206566400:do_214631618315042816133',
    });
  });

  it('reports isLoading while the hierarchy is missing', () => {
    mockUseCollectionData = undefined;
    mockSummaryRecords = [];

    const { result } = renderHook(() => useLearningPath(undefined, undefined));
    expect(result.current.model.levels).toEqual([]);
  });
});
