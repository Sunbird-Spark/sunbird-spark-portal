import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useViewerSummary,
  useInvalidateViewerSummary,
  useOptimisticViewerSummaryPatch,
  useMergeViewerSummaryRecord,
} from './useViewerSummary';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

const mockSummaryList = vi.fn();
vi.mock('../services/viewer', () => ({
  viewerService: {
    summaryList: (...args: unknown[]) => mockSummaryList(...args),
  },
}));

const { mockUseUserId } = vi.hoisted(() => ({ mockUseUserId: vi.fn((): string | null => 'user_1') }));
vi.mock('./useAuthInfo', () => ({
  useUserId: mockUseUserId,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useViewerSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserId.mockReturnValue('user_1');
  });

  it('does not call the API when there is no userId', () => {
    mockUseUserId.mockReturnValue(null);
    renderHook(() => useViewerSummary(), { wrapper });
    expect(mockSummaryList).not.toHaveBeenCalled();
  });

  it('fetches and normalises the live wire shape (response[] with courseId/batchId)', async () => {
    mockSummaryList.mockResolvedValue({
      data: {
        response: [
          {
            courseId: 'do_lp',
            batchId: 'batch_1',
            userId: 'user_1',
            active: true,
            status: 1,
            progress: 1,
            contentStatus: { do_a: 1 },
          },
        ],
      },
    });

    const { result } = renderHook(() => useViewerSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      expect.objectContaining({ collectionId: 'do_lp', contextId: 'batch_1' }),
    ]);
  });

});

describe('useInvalidateViewerSummary', () => {
  it('returns a stable function that invalidates the viewerSummary query key', async () => {
    const { result } = renderHook(() => useInvalidateViewerSummary(), { wrapper });
    expect(typeof result.current).toBe('function');
    await expect(result.current()).resolves.toBeUndefined();
  });
});

describe('useMergeViewerSummaryRecord', () => {
  const seedRecords: ViewerSummaryRecord[] = [
    {
      userId: 'user_1',
      collectionId: 'do_course_1',
      contextId: 'lpbatch:do_course_1',
      active: true,
      status: 1,
      progress: 1,
      contentStatus: { do_res_1: 1 },
    },
    {
      userId: 'user_1',
      collectionId: 'do_lp',
      contextId: 'lpbatch',
      active: true,
      status: 1,
      progress: 1,
      contentStatus: { do_res_1: 1, do_res_2: 2 },
    },
  ];

  function seedCache(queryClient: QueryClient) {
    queryClient.setQueryData(['viewerSummary', 'user_1'], seedRecords);
  }

  // Regression: a confirmed /v1/summary/read record must REPLACE the matching
  // cached record (by collectionId + contextId), not just patch a field on it -
  // it's the source of truth for that exact enrolment.
  it('replaces the cached record matching collectionId + contextId', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useMergeViewerSummaryRecord(), { wrapper: localWrapper });
    result.current({
      userId: 'user_1',
      collectionId: 'do_course_1',
      contextId: 'lpbatch:do_course_1',
      active: true,
      status: 2,
      progress: 1,
      contentStatus: { do_res_1: 2 },
    });

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated).toHaveLength(2);
    expect(updated?.[0]?.contentStatus).toEqual({ do_res_1: 2 });
    // Unrelated (LP-root) record is untouched.
    expect(updated?.[1]).toEqual(seedRecords[1]);
  });

  it('appends the record when no cached entry matches collectionId + contextId yet', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useMergeViewerSummaryRecord(), { wrapper: localWrapper });
    result.current({
      userId: 'user_1',
      collectionId: 'do_course_2',
      contextId: 'lpbatch:do_course_2',
      active: true,
      status: 1,
      progress: 0,
      contentStatus: {},
    });

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated).toHaveLength(3);
    expect(updated?.[2]).toEqual(
      expect.objectContaining({ collectionId: 'do_course_2', contextId: 'lpbatch:do_course_2' })
    );
  });

  it('does nothing when there is no cached data yet', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useMergeViewerSummaryRecord(), { wrapper: localWrapper });
    expect(() =>
      result.current({
        userId: 'user_1',
        collectionId: 'do_course_1',
        contextId: 'lpbatch:do_course_1',
        active: true,
        status: 1,
        progress: 0,
        contentStatus: {},
      })
    ).not.toThrow();
  });

  // The live service does not return assessmentStatus, and this merge replaces
  // whole records - so without preservation every confirmation round-trip after
  // a submit would erase the score the optimistic patch had just recorded.
  it('preserves an existing assessmentStatus when the incoming record omits it', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['viewerSummary', 'user_1'], [
      { ...seedRecords[0]!, assessmentStatus: { do_res_1: { score: 8, max_score: 10, attempts: 1 } } },
      seedRecords[1]!,
    ]);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => useMergeViewerSummaryRecord(), { wrapper: localWrapper });

    result.current({
      userId: 'user_1',
      collectionId: 'do_course_1',
      contextId: 'lpbatch:do_course_1',
      active: true,
      status: 2,
      progress: 1,
      contentStatus: { do_res_1: 2 },
    });

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated?.[0]?.assessmentStatus).toEqual({ do_res_1: { score: 8, max_score: 10, attempts: 1 } });
    expect(updated?.[0]?.status).toBe(2);
  });

  it('lets a server-provided assessmentStatus win over the local one', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['viewerSummary', 'user_1'], [
      { ...seedRecords[0]!, assessmentStatus: { do_res_1: { score: 8, max_score: 10, attempts: 1 } } },
      seedRecords[1]!,
    ]);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => useMergeViewerSummaryRecord(), { wrapper: localWrapper });

    result.current({
      userId: 'user_1',
      collectionId: 'do_course_1',
      contextId: 'lpbatch:do_course_1',
      active: true,
      status: 2,
      progress: 1,
      contentStatus: { do_res_1: 2 },
      assessmentStatus: { do_res_1: { score: 9, max_score: 10, attempts: 3 } },
    });

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated?.[0]?.assessmentStatus?.do_res_1?.attempts).toBe(3);
  });

});

describe('useOptimisticViewerSummaryPatch', () => {
  const seedRecords: ViewerSummaryRecord[] = [
    {
      userId: 'user_1',
      collectionId: 'do_course_1',
      contextId: 'lpbatch:do_course_1',
      active: true,
      status: 1,
      progress: 1,
      contentStatus: { do_res_1: 1 },
    },
    {
      userId: 'user_1',
      collectionId: 'do_lp',
      contextId: 'lpbatch',
      active: true,
      status: 1,
      progress: 1,
      contentStatus: { do_res_1: 1, do_res_2: 2 },
    },
  ];

  function seedCache(queryClient: QueryClient) {
    queryClient.setQueryData(['viewerSummary', 'user_1'], seedRecords);
  }

  it('patches contentStatus on the record matching collectionId', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    result.current('do_course_1', 'do_res_1', 2);

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated?.[0]?.contentStatus).toEqual({ do_res_1: 2 });
  });

  it('also patches every other record that already tracks the contentId (e.g. the Learning Path root record)', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    result.current('do_course_1', 'do_res_1', 2);

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated?.[1]?.contentStatus).toEqual({ do_res_1: 2, do_res_2: 2 });
  });

  it('merges an assessmentStatus entry when a score is provided', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    result.current('do_course_1', 'do_res_1', 2, { score: 8, max_score: 10 });

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated?.[0]?.assessmentStatus).toEqual({ do_res_1: { score: 8, max_score: 10, attempts: 1 } });
  });

  it('leaves existing records untouched when patching an unrelated collection/content', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    result.current('do_unrelated_course', 'do_unrelated_content', 2);

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated?.slice(0, 2)).toEqual(seedRecords);
  });

  // Regression: without this, the very first write to a freshly-enrolled
  // course (no per-course summary record exists yet) would silently no-op,
  // and level lock/unlock would never react to that first completion.
  it('appends a new minimal record when no cached record matches collectionId yet', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(queryClient);
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    result.current('do_new_course', 'do_new_content', 2, { score: 5, max_score: 5 });

    const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
    expect(updated).toHaveLength(3);
    expect(updated?.[2]).toEqual(
      expect.objectContaining({
        userId: 'user_1',
        collectionId: 'do_new_course',
        contentStatus: { do_new_content: 2 },
        assessmentStatus: { do_new_content: { score: 5, max_score: 5, attempts: 1 } },
      })
    );
  });

  it('does nothing when there is no cached data yet', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    expect(() => result.current('do_course_1', 'do_res_1', 2)).not.toThrow();
    expect(queryClient.getQueryData(['viewerSummary', 'user_1'])).toBeUndefined();
  });

  describe('assessmentStatus best-of semantics', () => {
    function patchHook(queryClient: QueryClient) {
      const localWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
      return renderHook(() => useOptimisticViewerSummaryPatch(), { wrapper: localWrapper });
    }

    // A weaker retry must never lower a learner's best score - the legacy course
    // player takes the max across the score array, and this mirrors that.
    it('keeps the higher score across attempts and counts both', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      seedCache(queryClient);
      const { result } = patchHook(queryClient);

      result.current('do_course_1', 'do_res_1', 2, { score: 9, max_score: 10 });
      result.current('do_course_1', 'do_res_1', 2, { score: 4, max_score: 10 });

      const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
      expect(updated?.[0]?.assessmentStatus?.do_res_1).toEqual({
        score: 9,
        max_score: 10,
        attempts: 2,
      });
    });

    it('keeps a known max when a later submission reports 0', () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      seedCache(queryClient);
      const { result } = patchHook(queryClient);

      result.current('do_course_1', 'do_res_1', 2, { score: 4, max_score: 10 });
      result.current('do_course_1', 'do_res_1', 2, { score: 6, max_score: 0 });

      const updated = queryClient.getQueryData<ViewerSummaryRecord[]>(['viewerSummary', 'user_1']);
      expect(updated?.[0]?.assessmentStatus?.do_res_1?.max_score).toBe(10);
    });
  });
});
