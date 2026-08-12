import { useCallback, useEffect, useRef } from 'react';
import { viewerService } from '../services/viewer';
import { normaliseSummaryReadRecord } from '../services/viewer/summaryMapper';
import { calculateContentProgress, progressToStatus } from '../services/collection/contentProgressCalculator';
import type { ConsumptionSummary } from '../services/collection/contentProgressCalculator';
import { useUserId } from './useAuthInfo';
import { useInvalidateViewerSummary, useOptimisticViewerSummaryPatch, useMergeViewerSummaryRecord } from './useViewerSummary';
import { eventHasScore, extractSummary } from './contentStateTelemetryEvent';
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
  const mergeSummaryRecord = useMergeViewerSummaryRecord();
  const startedRef = useRef(false);
  const assessEventsRef = useRef<unknown[]>([]);

  useEffect(() => {
    startedRef.current = false;
    assessEventsRef.current = [];
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
    // Optimistic: mark complete the instant the player signals a scored submission,
    // so level lock/unlock reacts immediately rather than waiting on any network call.
    patchSummary(collectionId, contentId, ContentStatus.Completed);
    try {
      await viewerService.viewAssess({
        userId,
        contentId,
        collectionId,
        contextId,
        assessments: assessEventsRef.current,
      });
      await confirmEnrolment();
    } finally {
      assessEventsRef.current = [];
      await invalidateSummary();
    }
  }, [collectionId, contentId, contextId, userId, patchSummary, confirmEnrolment, invalidateSummary]);

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
          void sendAssess();
        }
        return;
      }

      if (eidUpper === 'END') {
        const summary = extractSummary(event);
        if (isSelfAssess) {
          const hasScore =
            eventHasScore(event, false) ||
            assessEventsRef.current.some((e) => eventHasScore(e as TelemetryEvent, false));
          if (hasScore) {
            void sendAssess();
          }
        }
        const effectiveProgress = calculateContentProgress(summary as ConsumptionSummary[], mimeType ?? '');
        // Optimistic: reflect this content's new status immediately (drives
        // level lock/unlock via useLearningPath) rather than waiting on the
        // server round-trip below.
        patchSummary(collectionId, contentId, progressToStatus(effectiveProgress));
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
