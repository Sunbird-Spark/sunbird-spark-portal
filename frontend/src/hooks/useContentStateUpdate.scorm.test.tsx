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

describe('useContentStateUpdate — SCORM (mimeType)', () => {
  const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
  const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

  const scormParams = {
    collectionId: 'course_1',
    contentId: 'content_1',
    effectiveBatchId: 'batch_1',
    isEnrolledInCurrentBatch: true,
    mimeType: 'application/vnd.ekstep.scorm-archive',
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

  it('sends status 2 on END with endpageseen and no score (lesson_status completed, no quiz)', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...scormParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({ eid: 'END', edata: { summary: [{ endpageseen: true }] } });
    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contents: [{ contentId: 'content_1', status: 2 }],
      });
    });
    expect(mockMutateAsync.mock.calls[0]?.[0]?.assessments).toBeUndefined();
  });

  it('detects a string score (SCORM API values are always strings) and sends status 2 with assessments', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...scormParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({
      eid: 'ASSESS',
      edata: { score: '95', item: { id: 'ITEM1', maxscore: '100' }, pass: 'Yes' },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    result.current({ eid: 'END', edata: { summary: [{ endpageseen: true }] } });
    await vi.waitFor(() => {
      // Call 0 is START's own status:1 PATCH; call 1 is the ASSESS-triggered send.
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
    const call = mockMutateAsync.mock.calls[1]?.[0] as
      | {
          contents: { status: number }[];
          assessments?: { events: { edata: { score: number; item: { maxscore: number } } }[] }[];
        }
      | undefined;
    expect(call?.contents).toEqual([
      expect.objectContaining({ contentId: 'content_1', status: 2 }),
    ]);
    expect(call?.assessments).toHaveLength(1);
    // Score/maxscore must be normalized to real numbers, not left as SCORM's
    // native strings, so the backend's totalScore aggregation doesn't break.
    const sentEvent = call?.assessments?.[0]?.events?.[0];
    expect(sentEvent?.edata.score).toBe(95);
    expect(typeof sentEvent?.edata.score).toBe('number');
    expect(sentEvent?.edata.item.maxscore).toBe(100);
    expect(typeof sentEvent?.edata.item.maxscore).toBe('number');
  });

  it('still records the score via a follow-up PATCH when END fires before ASSESS (unreliable player ordering)', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...scormParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    // END arrives before ASSESS (the exact race the addendum guards against).
    // END alone already completes the content (no assessments yet); ASSESS
    // then arrives and sends a follow-up PATCH carrying the score.
    result.current({ eid: 'END', edata: { summary: [{ endpageseen: true }] } });
    result.current({
      eid: 'ASSESS',
      edata: { score: '95', pass: 'Yes' },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    await vi.waitFor(() => {
      // Call 0 is START's own status:1 PATCH; call 1 is END's scoreless shortcut;
      // call 2 is the ASSESS-triggered follow-up carrying the score.
      expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    });
    const firstCall = mockMutateAsync.mock.calls[1]?.[0] as
      | { contents: { status: number }[]; assessments?: unknown[] }
      | undefined;
    const secondCall = mockMutateAsync.mock.calls[2]?.[0] as
      | { contents: { status: number }[]; assessments?: unknown[] }
      | undefined;
    expect(firstCall?.contents).toEqual([
      expect.objectContaining({ contentId: 'content_1', status: 2 }),
    ]);
    expect(firstCall?.assessments).toBeUndefined();
    expect(secondCall?.contents).toEqual([
      expect.objectContaining({ contentId: 'content_1', status: 2 }),
    ]);
    expect(secondCall?.assessments).toHaveLength(1);
  });

  it('sends every quiz score within a session (not silently dropped after the first) using the same attemptId', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...scormParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({
      eid: 'ASSESS',
      edata: { score: '300', item: { id: 'SCO1', maxscore: '700' }, pass: 'No' },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    await vi.waitFor(() => {
      // Call 0 is START's status:1 PATCH; call 1 is the first quiz's send.
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
    // Wait for the first send's full async chain (including its `finally`,
    // which resets sendingAssessmentRef) to settle before firing the next
    // quiz's ASSESS - otherwise it can arrive while still "in flight".
    // (invalidateQueries call 1 is from START, call 2 is from this send.)
    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
    });
    result.current({
      eid: 'ASSESS',
      edata: { score: '700', item: { id: 'SCO1', maxscore: '700' }, pass: 'Yes' },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);
    await vi.waitFor(() => {
      // Call 2 is the second quiz's send - must still fire, not be dropped.
      expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    });
    const firstSend = mockMutateAsync.mock.calls[1]?.[0] as
      | { assessments?: { attemptId: string }[] }
      | undefined;
    const secondSend = mockMutateAsync.mock.calls[2]?.[0] as
      | { assessments?: { attemptId: string }[] }
      | undefined;
    expect(firstSend?.assessments?.[0]?.attemptId).toBeDefined();
    expect(secondSend?.assessments?.[0]?.attemptId).toBe(firstSend?.assessments?.[0]?.attemptId);
  });

  it('does not drop a quiz score that arrives while the previous send is still in flight', async () => {
    let resolveFirstSend: (() => void) | undefined;
    mockMutateAsync
      .mockImplementationOnce(() => Promise.resolve(undefined)) // START's status:1 PATCH
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstSend = () => resolve(undefined);
          })
      ) // first quiz's send - stays pending until we resolve it manually
      .mockResolvedValue(undefined); // second quiz's send, once redriven

    const { result } = renderHook(() =>
      useContentStateUpdate({ ...scormParams, currentContentStatus: 1 })
    );
    result.current({ eid: 'START', ets: 1700000000000 });
    result.current({
      eid: 'ASSESS',
      edata: { score: '300', item: { id: 'SCO1', maxscore: '700' }, pass: 'No' },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);

    await vi.waitFor(() => {
      // Call 0 START, call 1 the first quiz's send (now pending in-flight).
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });

    // Second quiz's score arrives WHILE the first send is still unresolved.
    result.current({
      eid: 'ASSESS',
      edata: { score: '700', item: { id: 'SCO1', maxscore: '700' }, pass: 'Yes' },
    } as Parameters<ReturnType<typeof useContentStateUpdate>>[0]);

    // It must not fire yet (a send is in flight), and must not be lost either.
    expect(mockMutateAsync).toHaveBeenCalledTimes(2);

    resolveFirstSend?.();

    await vi.waitFor(() => {
      // The queued second event must be redriven once the first send settles.
      expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    });

    // The redrive is not cleared of the first event (assessEventsRef only
    // resets on the idle path), so both quiz scores are carried in this send -
    // the important thing is the second (queued-while-in-flight) score isn't lost.
    const secondSend = mockMutateAsync.mock.calls[2]?.[0] as
      | { assessments?: { events: { edata: { score: number } }[] }[] }
      | undefined;
    const events = secondSend?.assessments?.[0]?.events;
    expect(events?.map((e) => e.edata.score)).toEqual([300, 700]);
  });

  it('caps status at 1 when END has no endpageseen and no score', async () => {
    const { result } = renderHook(() =>
      useContentStateUpdate({ ...scormParams, currentContentStatus: 1 })
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
});
