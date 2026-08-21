import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMySkills } from './useMySkills';
import { LP_HIERARCHY_NO_ASSESSMENTS } from '../services/learningPath/__fixtures__/lpHierarchyNoAssessments.fixture';
import type { TrackableCollection } from '../types/TrackableCollections';

const LP_ID = LP_HIERARCHY_NO_ASSESSMENTS.identifier;

let mockCourses: TrackableCollection[] = [];

vi.mock('./useUserEnrolledCollections', () => ({
  useUserEnrolledCollections: () => ({
    data: { data: { courses: mockCourses } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('./useViewerSummary', () => ({
  useViewerSummary: () => ({ data: [], isLoading: false }),
}));

vi.mock('../services/collection', () => ({
  collectionService: {
    getHierarchy: vi.fn(async () => ({ data: { content: LP_HIERARCHY_NO_ASSESSMENTS } })),
  },
  mapToCollectionData: (content: typeof LP_HIERARCHY_NO_ASSESSMENTS) => ({
    id: content.identifier,
    title: content.name ?? '',
    hierarchyRoot: content,
    children: content.children ?? [],
  }),
}));

function learningPathEnrollment(overrides: Partial<TrackableCollection>): TrackableCollection {
  return {
    courseId: LP_ID,
    courseName: 'TLP-1',
    collectionId: LP_ID,
    contentId: LP_ID,
    batchId: 'batch-1',
    userId: 'u1',
    addedBy: 'u1',
    active: true,
    status: 1,
    completionPercentage: 0,
    progress: 0,
    leafNodesCount: 3,
    description: '',
    courseLogoUrl: '',
    dateTime: 0,
    enrolledDate: 0,
    content: { primaryCategory: 'Learning Path', name: 'TLP-1' } as TrackableCollection['content'],
    ...overrides,
  } as TrackableCollection;
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useMySkills', () => {
  beforeEach(() => {
    mockCourses = [];
  });

  it('returns no paths when there are no enrollments', () => {
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.totalCount).toBe(0);
    expect(result.current.entries).toEqual([]);
  });

  it('excludes non-Learning-Path enrollments', () => {
    mockCourses = [
      learningPathEnrollment({
        courseId: 'course-1',
        batchId: 'batch-2',
        content: { primaryCategory: 'Course', name: 'A Course' } as TrackableCollection['content'],
      }),
    ];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.totalCount).toBe(0);
  });

  it('excludes the composite per-course records a Learning Path enrolment fans out', () => {
    mockCourses = [learningPathEnrollment({ batchId: 'lp-batch:course-x' })];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.totalCount).toBe(0);
  });

  it('fetches the hierarchy for an enrolled Learning Path and builds its skill summary', async () => {
    mockCourses = [learningPathEnrollment({})];
    const { result } = renderHook(() => useMySkills(), { wrapper });

    expect(result.current.totalCount).toBe(1);
    await waitFor(() => expect(result.current.analyzedCount).toBe(1));

    expect(result.current.entries[0]?.summary?.pathId).toBe(LP_ID);
    expect(result.current.aggregate.totalSkills).toBeGreaterThan(0);
  });
});
