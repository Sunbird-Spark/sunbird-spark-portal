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

  it('calls contentStateUpdate with status 1 and does not invalidate on START', async () => {
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
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
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
});
