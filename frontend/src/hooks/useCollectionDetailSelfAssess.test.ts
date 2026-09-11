import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCollectionDetailSelfAssess } from './useCollectionDetailSelfAssess';
import type { HierarchyContentNode } from '@/types/collectionTypes';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockFindNodeById = vi.fn();
const mockIsSelfAssess = vi.fn();

vi.mock('@/services/collection/hierarchyTree', () => ({
  findNodeById: (root: HierarchyContentNode, id: string) => mockFindNodeById(root, id),
}));

vi.mock('@/services/collection/enrollmentMapper', () => ({
  isSelfAssess: (node: HierarchyContentNode | null | undefined) => mockIsSelfAssess(node),
}));

describe('useCollectionDetailSelfAssess', () => {
  const selfAssessNode: HierarchyContentNode = {
    identifier: 'quiz-1',
    name: 'Quiz',
    mimeType: 'application/vnd.ekstep.quiz',
    contentType: 'SelfAssess',
    maxAttempts: 2,
  };

  const defaultParams = {
    contentId: 'quiz-1',
    collectionData: { hierarchyRoot: selfAssessNode } as { hierarchyRoot: HierarchyContentNode },
    hasBatchInRoute: true,
    isEnrolledInCurrentBatch: true,
    contentCreatorPrivilege: false,
    contentAttemptInfoMap: {} as Record<string, { attemptCount: number }>,
    rawPlayerMetadata: { mimeType: 'application/vnd.ekstep.quiz' },
    playerIsLoading: false,
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindNodeById.mockImplementation((_root: HierarchyContentNode, id: string) =>
      id === 'quiz-1' ? selfAssessNode : undefined
    );
    mockIsSelfAssess.mockReturnValue(true);
  });

  it('returns currentContentNode from findNodeById', () => {
    const { result } = renderHook(() => useCollectionDetailSelfAssess(defaultParams));
    expect(mockFindNodeById).toHaveBeenCalledWith(selfAssessNode, 'quiz-1');
    expect(result.current.currentContentNode).toBe(selfAssessNode);
  });

  it('returns maxAttemptsExceeded true when attemptCount >= maxAttempts', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 2 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(true);
  });

  it('returns maxAttemptsExceeded false when attemptCount < maxAttempts', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 0 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(false);
  });

  it('returns maxAttemptsExceeded false when not selfAssess node', () => {
    mockIsSelfAssess.mockReturnValue(false);
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 5 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(false);
  });

  it('returns maxAttemptsExceeded true for SCORM content even when isSelfAssess is false', () => {
    mockIsSelfAssess.mockReturnValue(false);
    const scormNode: HierarchyContentNode = {
      identifier: 'scorm-1',
      mimeType: 'application/vnd.ekstep.scorm-archive',
      maxAttempts: 2,
    };
    mockFindNodeById.mockImplementation((_root: HierarchyContentNode, id: string) =>
      id === 'scorm-1' ? scormNode : undefined
    );
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentId: 'scorm-1',
        contentAttemptInfoMap: { 'scorm-1': { attemptCount: 2 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(true);
  });

  it('does not flip maxAttemptsExceeded true mid-session when attemptCount reaches maxAttempts as a side effect of THIS session (e.g. query invalidation after this attempt\'s own first scored event)', () => {
    // maxAttempts is 2 (from selfAssessNode); attempt starts below the limit.
    const { result, rerender } = renderHook(
      (props: typeof defaultParams) => useCollectionDetailSelfAssess(props),
      { initialProps: { ...defaultParams, contentAttemptInfoMap: { 'quiz-1': { attemptCount: 1 } } } }
    );
    expect(result.current.maxAttemptsExceeded).toBe(false);
    // Simulates the mid-session bump: this attempt's own first scored event
    // invalidates the contentState query, refetch now reports attemptCount
    // reaching maxAttempts - must NOT retroactively exceed for this session.
    rerender({ ...defaultParams, contentAttemptInfoMap: { 'quiz-1': { attemptCount: 2 } } });
    expect(result.current.maxAttemptsExceeded).toBe(false);
  });

  it('still correctly reports maxAttemptsExceeded true on a fresh mount when attempts were already exhausted before this session', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 2 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(true);
  });

  it('returns maxAttemptsExceeded false when hasBatchInRoute is false', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        hasBatchInRoute: false,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 5 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(false);
  });

  it('returns maxAttemptsExceeded false when contentCreatorPrivilege is true', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentCreatorPrivilege: true,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 5 } },
      })
    );
    expect(result.current.maxAttemptsExceeded).toBe(false);
  });

  it('enriches playerMetadata with maxAttempts and currentAttempt when selfAssess and not exceeded', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 1 } },
      })
    );
    expect(result.current.playerMetadata).toEqual({
      mimeType: 'application/vnd.ekstep.quiz',
      maxAttempts: 2,
      currentAttempt: 1,
    });
  });

  it('still merges maxAttempts/currentAttempt into playerMetadata when maxAttemptsExceeded (the player itself gates on these)', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 2 } },
      })
    );
    expect(result.current.playerMetadata).toEqual({
      mimeType: 'application/vnd.ekstep.quiz',
      maxAttempts: 2,
      currentAttempt: 2,
    });
  });

  it('returns raw playerMetadata when not selfAssessWithBatch', () => {
    mockIsSelfAssess.mockReturnValue(false);
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 0 } },
      })
    );
    expect(result.current.playerMetadata).toEqual({ mimeType: 'application/vnd.ekstep.quiz' });
  });

  it('handleGoBack calls navigate(-1)', () => {
    const { result } = renderHook(() => useCollectionDetailSelfAssess(defaultParams));
    result.current.handleGoBack();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('returns undefined currentContentNode when contentId is missing', () => {
    mockFindNodeById.mockClear();
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({ ...defaultParams, contentId: undefined })
    );
    expect(mockFindNodeById).not.toHaveBeenCalled();
    expect(result.current.currentContentNode).toBeUndefined();
  });

  it('returns undefined currentContentNode when collectionData has no hierarchyRoot', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({ ...defaultParams, collectionData: null })
    );
    expect(result.current.currentContentNode).toBeUndefined();
  });

  it('shows last-attempt toast when isLastAttemptForPlayer and playerMetadata is ready', () => {
    renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 1 } },
      })
    );
    expect(mockToast).toHaveBeenCalledWith({
      title: 'courseDetails.selfAssessLastAttempt',
      variant: 'default',
      viewport: 'center',
    });
  });

  it('does not show last-attempt toast when playerIsLoading', () => {
    renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 1 } },
        playerIsLoading: true,
      })
    );
    expect(mockToast).not.toHaveBeenCalled();
  });
});
