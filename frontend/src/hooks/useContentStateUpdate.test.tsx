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
  default: {
    getUserId: vi.fn(),
  },
}));

describe('useContentStateUpdate', () => {
  const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
  const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

  const defaultParams = {
    collectionId: 'course_1',
    contentId: 'content_1',
    effectiveBatchId: 'batch_1',
    isEnrolledInCurrentBatch: true,
    mimeType: 'video/mp4',
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

  it('returns a function', () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    expect(typeof result.current).toBe('function');
  });

  it('does not call contentStateUpdate when not enrolled in batch', () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...defaultParams, isEnrolledInCurrentBatch: false })
    );
    result.current({ eid: 'START' });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call contentStateUpdate when collectionId is missing', () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...defaultParams, collectionId: undefined })
    );
    result.current({ eid: 'START' });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call contentStateUpdate when isBatchEnded is true', () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...defaultParams, isBatchEnded: true })
    );
    result.current({ eid: 'START' });
    result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call contentStateUpdate when currentContentStatus is 2', () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...defaultParams, currentContentStatus: 2 })
    );
    result.current({ eid: 'START' });
    result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call contentStateUpdate when skipContentStateUpdate is true', () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...defaultParams, skipContentStateUpdate: true })
    );
    result.current({ eid: 'START' });
    result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls contentStateUpdate with status 1 and invalidates on START', async () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({ eid: 'START' });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 1 }],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
    });
  });

  it('calls contentStateUpdate only once for multiple START events', async () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({ eid: 'START' });
    result.current({ eid: 'START' });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('retries START update on failure (does not set lastSentStatusRef so next START retries)', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({ eid: 'START' });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
    await new Promise((r) => setTimeout(r, 0));
    mockMutateAsync.mockResolvedValue(undefined);
    result.current({ eid: 'START' });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
  });

  it('calls contentStateUpdate with computed status and invalidates on END', async () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({
      eid: 'END',
      edata: { summary: [{ progress: 100 }] },
    });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 2 }],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
    });
  });

  it('does not call contentStateUpdate when getUserId returns undefined', () => {
    mockUseQuery.mockReturnValue({
      data: { uid: null, sid: 'session_1', isAuthenticated: false } as any,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({ eid: 'START' });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('reads eid from event.data when present', async () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({ data: { eid: 'START' } });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ contentId: 'content_1', status: 1 }],
        })
      );
    });
  });

  it('reads summary from event.data.edata.summary for END', async () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({
      eid: 'END',
      data: { edata: { summary: [{ progress: 50 }] } },
    });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ contentId: 'content_1', status: 1 }],
        })
      );
    });
  });

  describe('SelfAssess (contentType)', () => {
    const selfAssessParams = {
      ...defaultParams,
      contentType: 'SelfAssess',
    };

    it('does not call contentStateUpdate on START when currentContentStatus is 2', () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ eid: 'START', ets: 12345 });
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('treats contentType as SelfAssess when lowercase', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...defaultParams, contentType: 'selfassess' })
      );
      result.current({ eid: 'START' });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [{ contentId: 'content_1', status: 1 }],
          })
        );
      });
    });

    it('does not send status 2 on ASSESS with score alone (only on END with score)', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'ASSESS', edata: { score: 50 } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      await vi.waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('on END with score (after ASSESS with score) sends single PATCH with status 2 and assessments', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'ASSESS', edata: { score: 75 } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      result.current({ eid: 'END', edata: { summary: [{ endpageseen: true }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockMutateAsync).toHaveBeenCalledWith({
          userId: 'user_1',
          courseId: 'course_1',
          batchId: 'batch_1',
          contents: [
            {
              contentId: 'content_1',
              status: 2,
              lastAccessTime: expect.any(String),
            },
          ],
          assessments: [
            {
              assessmentTs: 1700000000000,
              batchId: 'batch_1',
              courseId: 'course_1',
              userId: 'user_1',
              attemptId: expect.any(String),
              contentId: 'content_1',
              events: [expect.objectContaining({ edata: { score: 75 } })],
            },
          ],
        });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
      });
    });

    it('on END after START without ASSESS score does NOT send a progress PATCH when currentContentStatus is 2 (no regression)', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      // START is guarded (currentContentStatus === 2), so no PATCH is sent there either.
      result.current({ eid: 'START', ets: 1700000000000 });
      // END without score/endpageseen must not downgrade an already-completed content.
      result.current({ eid: 'END' });
      // Allow any pending microtasks to settle.
      await new Promise((r) => setTimeout(r, 0));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('accumulates ASSESS events and sends them in assessments.events when END has score', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'ASSESS', data: { q1: 'a1' } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      result.current({ eid: 'ASSESS', data: { edata: { score: 80 } } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      result.current({ eid: 'END', edata: { summary: [{ endpageseen: true }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
      const call = mockMutateAsync.mock.calls[0]?.[0] as
        | { assessments: { events: unknown[] }[] }
        | undefined;
      expect(call).toBeDefined();
      expect(call!.assessments).toHaveLength(1);
      const firstAssessment = call!.assessments[0];
      expect(firstAssessment).toBeDefined();
      expect(firstAssessment!.events).toHaveLength(2);
      expect(firstAssessment!.events[0]).toEqual({ q1: 'a1' });
      expect(firstAssessment!.events[1]).toEqual({ edata: { score: 80 } });
    });

    it('on END without prior START uses progress path with status capped at 1 (no assessments)', async () => {
      const { result } = renderHook(() => useContentStateUpdate(selfAssessParams));
      result.current({
        eid: 'END',
        edata: { summary: [{ progress: 100 }] },
      });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 1 }],
      });
      expect(mockMutateAsync.mock.calls[0]?.[0]?.assessments).toBeUndefined();
    });

    it('when status is not 2, START sends status 1 and END sends progress path status 1 only (no status 2)', async () => {
      const { result } = renderHook(() => useContentStateUpdate(selfAssessParams));
      result.current({ eid: 'START', ets: 1700000000000 });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
      await Promise.resolve();
      await Promise.resolve();
      result.current({ eid: 'END' });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(2);
      });
      expect(mockMutateAsync).toHaveBeenNthCalledWith(1, {
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 1 }],
      });
      expect(mockMutateAsync).toHaveBeenNthCalledWith(2, {
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 1 }],
      });
      expect(mockMutateAsync.mock.calls[1]?.[0]?.assessments).toBeUndefined();
    });

    it('reads START ets from event.data when present for assessmentTs', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ data: { eid: 'START', ets: 999 } });
      result.current({ eid: 'ASSESS', edata: { score: 80 } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      result.current({ eid: 'END', edata: { summary: [{ endpageseen: true }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          assessments: [
            expect.objectContaining({
              assessmentTs: 999,
              contentId: 'content_1',
            }),
          ],
        })
      );
    });

    it('sends status 2 if score is found directly in the END event', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 1 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'END', edata: { score: 95, summary: [{ endpageseen: true }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [expect.objectContaining({ status: 2 })],
          })
        );
      });
    });

    it('sends status 2 if score is 0 (valid numeric score)', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 1 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'END', edata: { score: 0, summary: [{ endpageseen: true }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [expect.objectContaining({ status: 2 })],
          })
        );
      });
    });

    it('sends status 2 if score is found in summary array of END event', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 1 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'END', edata: { summary: [{ score: 100, endpageseen: true }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [expect.objectContaining({ status: 2 })],
          })
        );
      });
    });

    it('caps status at 1 if END event has progress but no score', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 1 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [expect.objectContaining({ status: 1 })],
          })
        );
      });
    });

    it('detects score when event is nested in a data object', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 1 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ data: { eid: 'END', edata: { score: 85, summary: { endpageseen: true } } } } as any);
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [expect.objectContaining({ status: 2 })],
          })
        );
      });
    });

    it('sends status 2 on renderer:question:submitscore event', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 1 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ data: 'renderer:question:submitscore' } as any);
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: [expect.objectContaining({ status: 2 })],
          })
        );
      });
    });

  });
});