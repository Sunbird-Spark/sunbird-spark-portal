import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContentView } from './useContentView';

const mockViewStart = vi.fn().mockResolvedValue({ data: {} });
const mockViewUpdate = vi.fn().mockResolvedValue({ data: {} });
const mockViewAssess = vi.fn().mockResolvedValue({ data: {} });
const mockViewEnd = vi.fn().mockResolvedValue({ data: {} });
const mockSummaryRead = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../services/viewer', () => ({
  viewerService: {
    viewStart: (...args: unknown[]) => mockViewStart(...args),
    viewUpdate: (...args: unknown[]) => mockViewUpdate(...args),
    viewAssess: (...args: unknown[]) => mockViewAssess(...args),
    viewEnd: (...args: unknown[]) => mockViewEnd(...args),
    summaryRead: (...args: unknown[]) => mockSummaryRead(...args),
  },
}));

vi.mock('./useAuthInfo', () => ({
  useUserId: () => 'user_1',
}));

const mockInvalidate = vi.fn().mockResolvedValue(undefined);
const mockPatchSummary = vi.fn();
const mockMergeRecord = vi.fn();
vi.mock('./useViewerSummary', () => ({
  useInvalidateViewerSummary: () => mockInvalidate,
  useOptimisticViewerSummaryPatch: () => mockPatchSummary,
  useMergeViewerSummaryRecord: () => mockMergeRecord,
}));

const mockRecordAssessmentScore = vi.fn();
vi.mock('./useAssessmentScores', () => ({
  useRecordAssessmentScore: () => mockRecordAssessmentScore,
}));

describe('useContentView', () => {
  const defaultParams = {
    collectionId: 'course_1',
    contentId: 'content_1',
    contextId: 'lpbatch:course_1',
    isEnrolledInCurrentBatch: true,
    mimeType: 'video/mp4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSummaryRead.mockResolvedValue({ data: {} });
  });

  it('returns a callback function', () => {
    const { result } = renderHook(() => useContentView(defaultParams));
    expect(typeof result.current).toBe('function');
  });

  it('calls viewStart on a START event', () => {
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
    });
    expect(mockViewStart).toHaveBeenCalledWith({
      userId: 'user_1',
      contentId: 'content_1',
      collectionId: 'course_1',
      contextId: 'lpbatch:course_1',
    });
  });

  it('only calls viewStart once per content across repeated START events', () => {
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
      result.current({ eid: 'START' });
    });
    expect(mockViewStart).toHaveBeenCalledTimes(1);
  });

  it('calls viewUpdate then viewEnd on an END event, then invalidates the summary cache', async () => {
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
      result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    });

    await waitFor(() => expect(mockViewUpdate).toHaveBeenCalled());
    expect(mockViewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', contentId: 'content_1', collectionId: 'course_1', contextId: 'lpbatch:course_1' })
    );
    await waitFor(() => expect(mockViewEnd).toHaveBeenCalled());
    await waitFor(() => expect(mockInvalidate).toHaveBeenCalled());
  });

  // Regression: the Viewer Service spec requires view/update to carry
  // "timespent" (seconds) alongside progressDetails - sourced from the END
  // telemetry event's edata.duration (confirmed present on the real player payload).
  it('includes timespent (from edata.duration) in the view/update call', async () => {
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
      result.current({ eid: 'END', edata: { summary: [{ progress: 100 }], duration: 12.63 } });
    });

    await waitFor(() => expect(mockViewUpdate).toHaveBeenCalled());
    expect(mockViewUpdate).toHaveBeenCalledWith(expect.objectContaining({ timespent: 12.63 }));
  });

  it('defaults timespent to 0 when the END event carries no duration', async () => {
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
      result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    });

    await waitFor(() => expect(mockViewUpdate).toHaveBeenCalled());
    expect(mockViewUpdate).toHaveBeenCalledWith(expect.objectContaining({ timespent: 0 }));
  });

  it('sends a viewAssess for a question set QUML_SUMMARY event with a completed score', async () => {
    const { result } = renderHook(() =>
      useContentView({ ...defaultParams, mimeType: 'application/vnd.sunbird.questionset' })
    );
    act(() => {
      result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
    });

    await waitFor(() => expect(mockViewAssess).toHaveBeenCalled());
    expect(mockViewAssess).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', contentId: 'content_1', collectionId: 'course_1', contextId: 'lpbatch:course_1' })
    );
  });

  // Regression: level lock/unlock and completion badges must update
  // immediately, not wait for any network round-trip - so the cache is
  // patched optimistically before the write even resolves.
  it('optimistically marks the content complete before the view/assess network call resolves', () => {
    const { result } = renderHook(() =>
      useContentView({ ...defaultParams, mimeType: 'application/vnd.sunbird.questionset' })
    );
    act(() => {
      result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
    });

    // The score rides along on the same optimistic patch, so "Best Score" appears
    // without waiting on a service that does not return assessmentStatus yet.
    // max_score is 0 here because no per-question ASSESS events were accumulated.
    expect(mockPatchSummary).toHaveBeenCalledWith('course_1', 'content_1', 2, {
      score: 8,
      max_score: 0,
    });
  });

  it('confirms the enrolment via summary/read after a successful viewAssess, and merges the record into the cache', async () => {
    mockSummaryRead.mockResolvedValueOnce({
      data: { response: { courseId: 'course_1', batchId: 'lpbatch:course_1', contentStatus: { content_1: 2 } } },
    });
    const { result } = renderHook(() =>
      useContentView({ ...defaultParams, mimeType: 'application/vnd.sunbird.questionset' })
    );
    act(() => {
      result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
    });

    await waitFor(() =>
      expect(mockSummaryRead).toHaveBeenCalledWith({
        userId: 'user_1',
        collectionId: 'course_1',
        contextId: 'lpbatch:course_1',
      })
    );
    await waitFor(() =>
      expect(mockMergeRecord).toHaveBeenCalledWith(
        expect.objectContaining({ collectionId: 'course_1', contextId: 'lpbatch:course_1' })
      )
    );
  });

  it('confirms the enrolment via summary/read after an END event (optimistic patch fires immediately)', async () => {
    mockSummaryRead.mockResolvedValueOnce({
      data: { response: { courseId: 'course_1', batchId: 'lpbatch:course_1', contentStatus: { content_1: 2 } } },
    });
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
      result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    });

    expect(mockPatchSummary).toHaveBeenCalledWith('course_1', 'content_1', 2);

    await waitFor(() =>
      expect(mockSummaryRead).toHaveBeenCalledWith({
        userId: 'user_1',
        collectionId: 'course_1',
        contextId: 'lpbatch:course_1',
      })
    );
    await waitFor(() => expect(mockMergeRecord).toHaveBeenCalled());
  });

  it('does not merge a record when summary/read confirmation fails (non-fatal)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockSummaryRead.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useContentView(defaultParams));
    act(() => {
      result.current({ eid: 'START' });
      result.current({ eid: 'END', edata: { summary: [{ progress: 100 }] } });
    });

    await waitFor(() => expect(mockSummaryRead).toHaveBeenCalled());
    await waitFor(() => expect(warnSpy).toHaveBeenCalledWith('summary/read confirmation failed:', expect.any(Error)));
    expect(mockMergeRecord).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('does nothing when not enrolled in the current batch', () => {
    const { result } = renderHook(() => useContentView({ ...defaultParams, isEnrolledInCurrentBatch: false }));
    act(() => {
      result.current({ eid: 'START' });
    });
    expect(mockViewStart).not.toHaveBeenCalled();
  });

  it('does nothing when the batch has ended', () => {
    const { result } = renderHook(() => useContentView({ ...defaultParams, isBatchEnded: true }));
    act(() => {
      result.current({ eid: 'START' });
    });
    expect(mockViewStart).not.toHaveBeenCalled();
  });

  it('does nothing when skipContentStateUpdate is true', () => {
    const { result } = renderHook(() => useContentView({ ...defaultParams, skipContentStateUpdate: true }));
    act(() => {
      result.current({ eid: 'START' });
    });
    expect(mockViewStart).not.toHaveBeenCalled();
  });

  it('does nothing for an already-completed non-assessment content', () => {
    const { result } = renderHook(() =>
      useContentView({ ...defaultParams, currentContentStatus: 2 })
    );
    act(() => {
      result.current({ eid: 'START' });
    });
    expect(mockViewStart).not.toHaveBeenCalled();
  });

  // Without an attemptId the service cannot tell one attempt from the next, so
  // it can never report an attempt count - which is why the Learning Path UI
  // had nothing to show. Mirrors the legacy content/state/update contract.
  describe('attempt identity', () => {
    const qsParams = { ...defaultParams, mimeType: 'application/vnd.sunbird.questionset' };

    it('sends an attemptId and assessmentTs with the assessment', async () => {
      const { result } = renderHook(() => useContentView(qsParams));
      act(() => {
        result.current({ eid: 'START', ets: 1700000000000 });
      });
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
      });

      await waitFor(() => expect(mockViewAssess).toHaveBeenCalled());
      expect(mockViewAssess).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptId: expect.any(String),
          assessmentTs: 1700000000000,
        })
      );
    });

    it('falls back to a generated timestamp when START was missed', async () => {
      const { result } = renderHook(() => useContentView(qsParams));
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
      });

      await waitFor(() => expect(mockViewAssess).toHaveBeenCalled());
      expect(mockViewAssess.mock.calls[0]![0].assessmentTs).toBeTypeOf('number');
    });

    it('sends explicit score and maxScore totals summed from the ASSESS events', async () => {
      const { result } = renderHook(() => useContentView(qsParams));
      act(() => {
        result.current({ eid: 'ASSESS', edata: { score: 3, item: { id: 'q1', maxscore: 5 } } });
      });
      act(() => {
        result.current({ eid: 'ASSESS', edata: { score: 2, item: { id: 'q2', maxscore: 5 } } });
      });
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 5, endpageseen: true } });
      });

      await waitFor(() => expect(mockViewAssess).toHaveBeenCalled());
      expect(mockViewAssess).toHaveBeenCalledWith(
        expect.objectContaining({ score: 5, maxScore: 10 })
      );
    });

    // Two submits for one attempt would be counted as two attempts server-side.
    it('ignores a second submit while the first is still in flight', async () => {
      let release: (value: unknown) => void = () => {};
      mockViewAssess.mockImplementationOnce(
        () => new Promise((resolve) => { release = resolve; })
      );
      const { result } = renderHook(() => useContentView(qsParams));
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
      });
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
      });
      expect(mockViewAssess).toHaveBeenCalledTimes(1);
      await act(async () => {
        release({ data: {} });
      });
    });

    it('starts a fresh attempt id on a replayed START', async () => {
      const { result } = renderHook(() => useContentView(qsParams));
      act(() => {
        result.current({ eid: 'START', ets: 1 });
      });
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 8, endpageseen: true } });
      });
      await waitFor(() => expect(mockViewAssess).toHaveBeenCalledTimes(1));

      act(() => {
        result.current({ eid: 'START', ets: 2 });
      });
      act(() => {
        result.current({ eid: 'QUML_SUMMARY', edata: { score: 9, endpageseen: true } });
      });
      await waitFor(() => expect(mockViewAssess).toHaveBeenCalledTimes(2));

      const first = mockViewAssess.mock.calls[0]![0].attemptId;
      const second = mockViewAssess.mock.calls[1]![0].attemptId;
      expect(second).not.toBe(first);
    });
  });

  // Regression: the END branch used to unconditionally re-patch this leaf's
  // status from `progressToStatus(effectiveProgress)` right after `sendAssess()`
  // had already optimistically patched it to Completed - since a SelfAssess
  // submission's END summary rarely carries a standard progress/endpageseen
  // signal, that second patch downgraded the leaf right back to NotStarted in
  // the same tick (see bug: level appears locked right after passing a
  // self-assessment).
  describe('SelfAssess END status', () => {
    const selfAssessParams = { ...defaultParams, contentType: 'SelfAssess' };

    it('does not downgrade the Completed status set by sendAssess when the END event carries no progress signal', () => {
      const { result } = renderHook(() => useContentView(selfAssessParams));
      act(() => {
        result.current({ eid: 'START' });
        result.current({ eid: 'ASSESS', edata: { score: 8, item: { maxscore: 10 } } });
        result.current({ eid: 'END', edata: {} });
      });

      expect(mockPatchSummary).toHaveBeenCalledTimes(1);
      expect(mockPatchSummary).toHaveBeenCalledWith('course_1', 'content_1', 2, { score: 8, max_score: 10 });
    });
  });
});
