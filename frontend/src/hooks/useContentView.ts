import { useCallback, useEffect, useRef } from 'react';
import { viewerService } from '../services/viewer';
import { normaliseSummaryReadRecord } from '../services/viewer/summaryMapper';
import { calculateContentProgress, progressToStatus } from '../services/collection/contentProgressCalculator';
import type { ConsumptionSummary } from '../services/collection/contentProgressCalculator';
import { useUserId } from './useAuthInfo';
import { useInvalidateViewerSummary, useOptimisticViewerSummaryPatch, useMergeViewerSummaryRecord } from './useViewerSummary';
import { useRecordAssessmentScore } from './useAssessmentScores';
import { eventHasScore, extractSummary, sumAssessEventTotals } from './contentStateTelemetryEvent';
import type { TelemetryEvent } from './contentStateTelemetryEvent';

const ContentStatus = {
  NotStarted: 0,
  InProgress: 1,
  Completed: 2,
} as const;

interface UseContentViewParams {
  /** The inner Course's id (Viewer Service `collectionId`). */
  collectionId: string | undefined;
  contentId: string | undefined;
  /** Composite `<lpContextId>:<courseId>` context id — see `services/viewer/summaryMapper.ts`. */
  contextId: string | undefined;
  isEnrolledInCurrentBatch: boolean;
  /** When true, no view API calls are made (batch end date has passed; content is view-only). */
  isBatchEnded?: boolean;
  mimeType: string | undefined;
  /** If 2 (completed), no progress calls are made; SelfAssess/question sets still submit assessment events to record attempts. */
  currentContentStatus?: number;
  /** When true (e.g. creator viewing own collection), no view API calls are made. */
  skipContentStateUpdate?: boolean;
  contentType?: string;
}

/**
 * Viewer Service equivalent of `useContentStateUpdate`, used only when the
 * player is opened in Learning Path context (`?lp=`, see AppRoutes). Writes
 * go through `/v1/view/start|update|end` + `/v1/assessment/submit` instead of
 * the legacy `content/state/update`.
 *
 * Display is NOT driven purely by an un-scoped `/v1/summary/list` refetch:
 *  1. The `['viewerSummary']` cache is patched optimistically the instant a
 *     write succeeds (see `useOptimisticViewerSummaryPatch`) - this is what
 *     makes completion badges and level lock/unlock (`useLearningPath`
 *     derives both synchronously from that cache) update immediately.
 *  2. `POST /v1/summary/read` (the "specific enrolment" API, synchronous) is
 *     then called with this exact `collectionId`/`contextId` to confirm/
 *     correct that optimistic guess with the server's own record for this
 *     enrolment - see `confirmEnrolment` below.
 *  3. A plain `useInvalidateViewerSummary` runs afterwards so the
 *     Learning-Path-root record (a different `collectionId`) picks up the
 *     change too.
 * Every existing (non-Learning-Path) course screen keeps using
 * `useContentStateUpdate` unchanged.
 */
export function useContentView({
  collectionId,
  contentId,
  contextId,
  isEnrolledInCurrentBatch,
  isBatchEnded = false,
  mimeType,
  currentContentStatus,
  skipContentStateUpdate = false,
  contentType,
}: UseContentViewParams): (event: TelemetryEvent) => void {
  const userId = useUserId();
  const invalidateSummary = useInvalidateViewerSummary();
  const patchSummary = useOptimisticViewerSummaryPatch();
  const recordAssessmentScore = useRecordAssessmentScore();
  const mergeSummaryRecord = useMergeViewerSummaryRecord();
  const startedRef = useRef(false);
  const assessEventsRef = useRef<unknown[]>([]);
  /** Attempt start time (START's `ets`), sent as `assessmentTs`. */
  const assessmentTsRef = useRef<number | null>(null);
  /** One id per attempt; cleared on START so the next play gets a fresh one. */
  const attemptIdRef = useRef<string | null>(null);
  /** Guards against overlapping submits, which would double-count the attempt. */
  const sendingAssessmentRef = useRef(false);
  /** Attempt total from QUML_SUMMARY, which is more authoritative than summing ASSESS events. */
  const summaryScoreRef = useRef<number | null>(null);

  useEffect(() => {
    startedRef.current = false;
    assessEventsRef.current = [];
    assessmentTsRef.current = null;
    attemptIdRef.current = null;
    sendingAssessmentRef.current = false;
    summaryScoreRef.current = null;
  }, [contentId]);

  /**
   * Confirms/corrects the optimistic patch with the server's own record for
   * this exact enrolment (`POST /v1/summary/read`), called after both
   * `view/end` and `assessment/submit`. Synchronous and precisely scoped by
   * `collectionId`/`contextId`, so there's no "individual content" ambiguity
   * the way there was reading back from `/v1/view/read`.
   */
  const confirmEnrolment = useCallback(async () => {
    if (!collectionId || !contentId || !contextId || !userId) return;
    try {
      const response = await viewerService.summaryRead({ userId, collectionId, contextId });
      const record = normaliseSummaryReadRecord(response.data);
      if (record) mergeSummaryRecord(record);
    } catch (err) {
      // Non-fatal - the optimistic patch already applied, and the plain
      // summary invalidation below still reconciles the LP-root record.
      console.warn('summary/read confirmation failed:', err);
    }
  }, [collectionId, contentId, contextId, userId, mergeSummaryRecord]);

  const sendAssess = useCallback(async () => {
    if (!collectionId || !contentId || !contextId || !userId) return;
    // A submit may already be in flight (e.g. QUML_SUMMARY and END both firing);
    // letting a second one through would count as an extra attempt server-side.
    if (sendingAssessmentRef.current) return;
    sendingAssessmentRef.current = true;

    const totals = sumAssessEventTotals(assessEventsRef.current);
    // QUML_SUMMARY reports the attempt total directly; fall back to summing the
    // per-question ASSESS events (the only source for SelfAssess content).
    const score = summaryScoreRef.current ?? totals.score;
    const maxScore = totals.maxScore;
    // One id per attempt, generated lazily so a play that never submits doesn't burn one.
    if (attemptIdRef.current == null) {
      attemptIdRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${collectionId}-${contextId}-${contentId}-${userId}-${Date.now()}`;
    }
    // START may have been missed (e.g. resumed player); the attempt still needs a timestamp.
    const assessmentTs = assessmentTsRef.current ?? Date.now();

    // Optimistic: mark complete the instant the player signals a scored submission,
    // so level lock/unlock reacts immediately rather than waiting on any network call.
    // The score rides along so "Best Score" renders without waiting on the service,
    // which does not return `assessmentStatus` yet.
    patchSummary(collectionId, contentId, ContentStatus.Completed, {
      score,
      max_score: maxScore,
    });
    // Durable: survives the `invalidateSummary()` refetch below (which wipes the
    // optimistic patch above, since the live service doesn't return
    // `assessmentStatus`) and survives a full page reload, unlike the query cache.
    recordAssessmentScore(userId, collectionId, contextId, contentId, { score, maxScore });
    try {
      await viewerService.viewAssess({
        userId,
        contentId,
        collectionId,
        contextId,
        assessments: assessEventsRef.current,
        attemptId: attemptIdRef.current,
        assessmentTs,
        score,
        maxScore,
      });
      await confirmEnrolment();
    } finally {
      assessEventsRef.current = [];
      summaryScoreRef.current = null;
      sendingAssessmentRef.current = false;
      await invalidateSummary();
    }
  }, [collectionId, contentId, contextId, userId, patchSummary, recordAssessmentScore, confirmEnrolment, invalidateSummary]);

  return useCallback(
    (event: TelemetryEvent) => {
      if (skipContentStateUpdate) return;
      if (!isEnrolledInCurrentBatch || !collectionId || !contentId || !contextId || !userId) return;
      if (isBatchEnded) return;

      const isSelfAssess = (contentType ?? '').toLowerCase() === 'selfassess';
      const isQuestionSet = (mimeType ?? '').toLowerCase() === 'application/vnd.sunbird.questionset';
      if (!isSelfAssess && !isQuestionSet && currentContentStatus === ContentStatus.Completed) return;

      const rawEvent = event?.data ?? event;
      const eid =
        typeof rawEvent === 'string'
          ? ''
          : ((event?.eid ?? (event?.data as { eid?: string } | undefined)?.eid ?? event?.type ?? '') as string);
      const eidUpper = eid.toUpperCase();

      if (eidUpper === 'START') {
        const ets = (rawEvent as { ets?: number } | undefined)?.ets ?? event?.ets;
        if (ets != null) assessmentTsRef.current = ets;
        // A replay within the same mount is a new attempt, so drop the previous
        // attempt's id and accumulated events.
        attemptIdRef.current = null;
        assessEventsRef.current = [];
        summaryScoreRef.current = null;
        if (!startedRef.current) {
          startedRef.current = true;
          void viewerService.viewStart({ userId, contentId, collectionId, contextId });
        }
        return;
      }

      if (eidUpper === 'ASSESS') {
        const rawEventData = event?.data ?? event;
        assessEventsRef.current = [...assessEventsRef.current, rawEventData ?? event];
        return;
      }

      if (eidUpper === 'QUML_SUMMARY' && isQuestionSet) {
        const edataQ = (rawEvent as { edata?: { score?: unknown; endpageseen?: unknown } })?.edata;
        if (typeof edataQ?.score === 'number' && Boolean(edataQ?.endpageseen)) {
          summaryScoreRef.current = edataQ.score;
          void sendAssess();
        }
        return;
      }

      if (eidUpper === 'END') {
        const summary = extractSummary(event);
        // Set when `sendAssess()` below already optimistically patched this
        // leaf to Completed - a SelfAssess submission's END summary rarely
        // carries a standard progress/endpageseen signal, so the unconditional
        // progress-status patch further down would otherwise immediately
        // downgrade that just-set Completed status back to NotStarted/InProgress
        // in the same tick (see bug: level appears locked right after passing
        // a self-assessment).
        let selfAssessCompletedViaScore = false;
        if (isSelfAssess) {
          const hasScore =
            eventHasScore(event, false) ||
            assessEventsRef.current.some((e) => eventHasScore(e as TelemetryEvent, false));
          if (hasScore) {
            selfAssessCompletedViaScore = true;
            void sendAssess();
          }
        }
        const effectiveProgress = calculateContentProgress(summary as ConsumptionSummary[], mimeType ?? '');
        // Optimistic: reflect this content's new status immediately (drives
        // level lock/unlock via useLearningPath) rather than waiting on the
        // server round-trip below.
        if (!selfAssessCompletedViaScore) {
          patchSummary(collectionId, contentId, progressToStatus(effectiveProgress));
        }
        // Per the Viewer Service spec, view/update's "timespent" (seconds) comes
        // from the END telemetry event's edata.duration.
        const rawDuration = (rawEvent as { edata?: { duration?: unknown } } | undefined)?.edata?.duration;
        const timespent = typeof rawDuration === 'number' ? rawDuration : 0;
        void viewerService
          .viewUpdate({
            userId,
            contentId,
            collectionId,
            contextId,
            progressDetails: { progress: effectiveProgress },
            timespent,
          })
          .then(() => viewerService.viewEnd({ userId, contentId, collectionId, contextId }))
          .then(() => confirmEnrolment())
          .then(() => invalidateSummary());
      }
    },
    [
      skipContentStateUpdate,
      isEnrolledInCurrentBatch,
      collectionId,
      contentId,
      contextId,
      userId,
      isBatchEnded,
      mimeType,
      contentType,
      currentContentStatus,
      sendAssess,
      patchSummary,
      confirmEnrolment,
      invalidateSummary,
    ]
  );
}
