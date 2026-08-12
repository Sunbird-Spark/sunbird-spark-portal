import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLearningPathEnrollment } from './useLearningPathEnrollment';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null, pathname: '/learning-path/lp_1', search: '' }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockEnrolMutateAsync = vi.fn().mockResolvedValue({});
const mockUnenrolMutateAsync = vi.fn().mockResolvedValue({});
const mockUseBatchRead = vi.fn();

vi.mock('./useBatch', () => ({
  useBatchListForLearner: () => ({ data: undefined, isLoading: false, error: null }),
  useBatchRead: (batchId: string | undefined) => mockUseBatchRead(batchId),
  useEnrol: () => ({ mutateAsync: mockEnrolMutateAsync, isPending: false, error: null, reset: vi.fn() }),
  useUnenrol: () => ({ mutateAsync: mockUnenrolMutateAsync }),
}));

vi.mock('./useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const mockToast = vi.fn();
vi.mock('./useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockAudit = vi.fn();
vi.mock('./useTelemetry', () => ({
  useTelemetry: () => ({ audit: mockAudit }),
}));

vi.mock('./useAuthInfo', () => ({
  useUserId: () => 'user_1',
}));

const summaryRecords: ViewerSummaryRecord[] = [
  {
    userId: 'user_1',
    collectionId: 'lp_1',
    contextId: 'batch_1',
    active: true,
    status: 1,
    progress: 1,
    contentStatus: {},
  },
];

describe('useLearningPathEnrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchRead.mockReturnValue({ data: undefined });
  });

  it('is not enrolled when no matching summary record exists', () => {
    const { result } = renderHook(() => useLearningPathEnrollment('lp_1', undefined, [], true));
    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.effectiveContextId).toBeUndefined();
  });

  it('is enrolled and resolves effectiveContextId from the path summary record', () => {
    const { result } = renderHook(() => useLearningPathEnrollment('lp_1', undefined, summaryRecords, true));
    expect(result.current.isEnrolled).toBe(true);
    expect(result.current.effectiveContextId).toBe('batch_1');
  });

  it('prefers the route contextId param over the summary record', () => {
    const { result } = renderHook(() => useLearningPathEnrollment('lp_1', 'route_batch', summaryRecords, true));
    expect(result.current.effectiveContextId).toBe('route_batch');
  });

  it('handleEnrol enrols, invalidates viewerSummary + userEnrollments, and navigates to the batch URL', async () => {
    const { result } = renderHook(() => useLearningPathEnrollment('lp_1', undefined, [], true));

    await act(async () => {
      await result.current.handleEnrol('new_batch');
    });

    expect(mockEnrolMutateAsync).toHaveBeenCalledWith({ courseId: 'lp_1', userId: 'user_1', batchId: 'new_batch' });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['viewerSummary', 'user_1'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['userEnrollments'] });
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ object: { id: 'lp_1', type: 'Learning Path' } })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/learning-path/lp_1/batch/new_batch', { state: null });
  });

  it('handleEnrol does nothing without a userId, pathId or contextId', async () => {
    const { result } = renderHook(() => useLearningPathEnrollment(undefined, undefined, [], true));

    await act(async () => {
      await result.current.handleEnrol('new_batch');
    });

    expect(mockEnrolMutateAsync).not.toHaveBeenCalled();
  });
});
