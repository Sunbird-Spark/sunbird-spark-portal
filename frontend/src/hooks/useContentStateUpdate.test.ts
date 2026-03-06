import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { useContentStateUpdate } from './useContentStateUpdate';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
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
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
  });

  it('calls contentStateUpdate only once for multiple START events', async () => {
    const { result } = renderHook(() => useContentStateUpdate(defaultParams));
    result.current({ eid: 'START' });
    result.current({ eid: 'START' });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
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
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
  });

  it('does not call contentStateUpdate when getUserId returns undefined', () => {
    (userAuthInfoService.getUserId as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
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

    it('on END after START sends single PATCH with contents and assessments', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'END' });
      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
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
            events: [],
          },
        ],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['contentState'] });
    });

    it('accumulates ASSESS events and sends them in assessments.events on END', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ eid: 'START', ets: 1700000000000 });
      result.current({ eid: 'ASSESS', data: { q1: 'a1' } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      result.current({ eid: 'ASSESS', data: { q2: 'a2' } } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
      result.current({ eid: 'END' });
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
      expect(firstAssessment!.events[1]).toEqual({ q2: 'a2' });
    });

    it('on END without prior START uses progress path (no assessments)', async () => {
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
        contents: [{ contentId: 'content_1', status: 2 }],
      });
      expect(mockMutateAsync.mock.calls[0]?.[0]?.assessments).toBeUndefined();
    });

    it('when status is not 2, START sends status 1 and END sends assessment (two calls)', async () => {
      const { result } = renderHook(() => useContentStateUpdate(selfAssessParams));
      result.current({ eid: 'START', ets: 1700000000000 });
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
      expect(mockMutateAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          contents: [{ contentId: 'content_1', status: 2, lastAccessTime: expect.any(String) }],
          assessments: [expect.objectContaining({ assessmentTs: 1700000000000, contentId: 'content_1' })],
        })
      );
    });

    it('reads START ets from event.data when present for assessmentTs', async () => {
      const { result } = renderHook(() =>
        useContentStateUpdate({ ...selfAssessParams, currentContentStatus: 2 })
      );
      result.current({ data: { eid: 'START', ets: 999 } });
      result.current({ eid: 'END' });
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
  });
});
