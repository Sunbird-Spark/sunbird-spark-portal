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

  it('enriches playerMetadata with maxAttempt and currentAttempt when selfAssess and not exceeded', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 1 } },
      })
    );
    expect(result.current.playerMetadata).toEqual({
      mimeType: 'application/vnd.ekstep.quiz',
      maxAttempt: 2,
      currentAttempt: 1,
    });
  });

  it('returns raw playerMetadata when maxAttemptsExceeded', () => {
    const { result } = renderHook(() =>
      useCollectionDetailSelfAssess({
        ...defaultParams,
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 2 } },
      })
    );
    expect(result.current.playerMetadata).toEqual({ mimeType: 'application/vnd.ekstep.quiz' });
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
