import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { useContentStateUpdate } from './useContentStateUpdate';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(() => ({
    data: { uid: 'user_1', sid: 'session_1', isAuthenticated: true },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
  useQuery: mockUseQuery,
}));

vi.mock('./useBatch', () => ({
  useContentStateUpdateMutation: vi.fn(() => ({ mutateAsync: mockMutateAsync })),
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: { getUserId: vi.fn() },
}));

describe('useContentStateUpdate — QuestionSet (QUML_SUMMARY scoring)', () => {
  const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
  const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

  const questionSetParams = {
    collectionId: 'course_1',
    contentId: 'content_1',
    effectiveBatchId: 'batch_1',
    isEnrolledInCurrentBatch: true,
    mimeType: 'application/vnd.sunbird.questionset',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: { uid: 'user_1', sid: 'session_1', isAuthenticated: true },
      isLoading: false,
      error: null,
    });
    (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryClient);
    (userAuthInfoService.getUserId as ReturnType<typeof vi.fn>).mockReturnValue('user_1');
  });

  it('calls contentStateUpdate with status 1 on START', async () => {
    const { result } = renderHook(() => useContentStateUpdate(questionSetParams));
    result.current({ eid: 'START', ets: 1700000000000 });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 1 }],
      });
    });
  });

  it('accumulates ASSESS events without submitting until QUML_SUMMARY', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 2 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'ASSESS', edata: { score: 10 } } as any);
    result.current({ eid: 'ASSESS', edata: { score: 5 } } as any);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('on QUML_SUMMARY with score + endpageseen sends PATCH with status 2 and assessments', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 2 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'ASSESS', edata: { score: 8 } } as any);
    result.current({
      eid: 'QUML_SUMMARY',
      ets: 1700000000000,
      edata: { score: 8, endpageseen: true },
    } as any);
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 2, lastAccessTime: expect.any(String) }],
        assessments: [{
          assessmentTs: 1700000000000,
          batchId: 'batch_1',
          courseId: 'course_1',
          userId: 'user_1',
          attemptId: expect.any(String),
          contentId: 'content_1',
          events: [expect.objectContaining({ edata: { score: 8 } })],
        }],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
    });
  });

  it('on QUML_SUMMARY without score does NOT submit assessment', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'QUML_SUMMARY', ets: 1700000000000, edata: { score: undefined, endpageseen: true } } as any);
    await new Promise((r) => setTimeout(r, 10));
    const assessmentCalls = mockMutateAsync.mock.calls.filter((call) => call[0]?.assessments != null);
    expect(assessmentCalls).toHaveLength(0);
  });

  it('on QUML_SUMMARY without endpageseen does NOT submit assessment', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'QUML_SUMMARY', ets: 1700000000000, edata: { score: 10, endpageseen: false } } as any);
    await new Promise((r) => setTimeout(r, 10));
    const assessmentCalls = mockMutateAsync.mock.calls.filter((call) => call[0]?.assessments != null);
    expect(assessmentCalls).toHaveLength(0);
  });

  it('uses ets from QUML_SUMMARY as assessmentTs fallback when START was not received', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 2 })
    );
    result.current({ eid: 'QUML_SUMMARY', ets: 1700000000999, edata: { score: 5, endpageseen: true } } as any);
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          assessments: [expect.objectContaining({ assessmentTs: 1700000000999 })],
        })
      );
    });
  });

  it('sends score 0 as a valid score (numeric zero)', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 2 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'QUML_SUMMARY', ets: 1700000000000, edata: { score: 0, endpageseen: true } } as any);
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ contents: [expect.objectContaining({ status: 2 })] })
      );
    });
  });

  it('does not submit when currentContentStatus is already 2 and criteria not met', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...questionSetParams, currentContentStatus: 2 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'QUML_SUMMARY', ets: 1700000000000, edata: { score: undefined, endpageseen: false } } as any);
    await new Promise((r) => setTimeout(r, 10));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
