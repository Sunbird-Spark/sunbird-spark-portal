import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useContentStateUpdateMutation } from "./useBatch";
import {
  calculateContentProgress,
  progressToStatus,
} from "../services/collection/contentProgressCalculator";
import type { ConsumptionSummary } from "../services/collection/contentProgressCalculator";
import { useUserId } from "./useAuthInfo";
import { eventHasScore, extractSummary, normalizeScormAssessEvent } from "./contentStateTelemetryEvent";
import type { TelemetryEvent } from "./contentStateTelemetryEvent";

interface UseContentStateUpdateParams {
  collectionId: string | undefined;
  contentId: string | undefined;
  effectiveBatchId: string | undefined;
  isEnrolledInCurrentBatch: boolean;
  /** When true, no state update API calls are made (batch end date has passed; content is view-only). */
  isBatchEnded?: boolean;
  mimeType: string | undefined;
  /** If 2 (completed), no API calls for progress; SelfAssess still sends assessment PATCH to record attempts. */
  currentContentStatus?: number;
  /** When true (e.g. creator viewing own collection), no progress/state API calls are made. */
  skipContentStateUpdate?: boolean;
  contentType?: string;
}

export function useContentStateUpdate({
  collectionId,
  contentId,
  effectiveBatchId,
  isEnrolledInCurrentBatch,
  isBatchEnded = false,
  mimeType,
  currentContentStatus,
  skipContentStateUpdate = false,
  contentType,
}: UseContentStateUpdateParams): (event: TelemetryEvent) => void {
  const queryClient = useQueryClient();
  const { mutateAsync: contentStateUpdate } = useContentStateUpdateMutation();
  const userId = useUserId();
  const lastSentStatusRef = useRef<number | null>(null);
  const startUpdateInFlightRef = useRef(false);

  const assessmentTsRef = useRef<number | null>(null);
  const assessEventsRef = useRef<unknown[]>([]);
  const sendingAssessmentRef = useRef(false);

  // Use refs for values that change after content state updates to keep the
  // returned telemetry callback identity stable and avoid re-initialising players.
  const currentContentStatusRef = useRef(currentContentStatus);
  useEffect(() => { currentContentStatusRef.current = currentContentStatus; }, [currentContentStatus]);
  const contentTypeRef = useRef(contentType);
  useEffect(() => { contentTypeRef.current = contentType; }, [contentType]);

  useEffect(() => {
    lastSentStatusRef.current = null;
    startUpdateInFlightRef.current = false;
    assessmentTsRef.current = null;
    assessEventsRef.current = [];
    sendingAssessmentRef.current = false;
  }, [contentId]);

  const handleContentStateUpdate = useCallback(
    async (status: number, invalidate: boolean) => {
      if (!collectionId || !contentId || !effectiveBatchId) return;
      if (!userId) return;
      try {
        await contentStateUpdate({
          userId,
          courseId: collectionId,
          batchId: effectiveBatchId,
          contents: [{ contentId, status }],
        });
        if (invalidate) {
          await queryClient.invalidateQueries({ queryKey: ["contentState"] });
        }
      } catch (err) {
        console.error("Content state update failed:", err);
        throw err;
      }
    },
    [collectionId, contentId, effectiveBatchId, userId, queryClient, contentStateUpdate]
  );

  const sendAssessmentAndInvalidate = useCallback(async () => {
    if (!collectionId || !contentId || !effectiveBatchId) return;
    if (!userId) return;
    const ts = assessmentTsRef.current;
    if (ts == null) return;
    const events = assessEventsRef.current;
    const attemptId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${collectionId}-${effectiveBatchId}-${contentId}-${userId}-${Date.now()}`;
    try {
      await contentStateUpdate({
        userId,
        courseId: collectionId,
        batchId: effectiveBatchId,
        contents: [{
          contentId,
          status: 2,
          lastAccessTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss:SSSZZ"),
        }],
        assessments: [{
          assessmentTs: ts,
          batchId: effectiveBatchId,
          courseId: collectionId,
          userId,
          attemptId,
          contentId,
          events: Array.isArray(events) ? events : [],
        }],
      });
      await queryClient.invalidateQueries({ queryKey: ["contentState"] });
    } catch (err) {
      console.error("Assessment state update failed:", err);
    } finally {
      assessmentTsRef.current = null;
      assessEventsRef.current = [];
      sendingAssessmentRef.current = false;
    }
  }, [collectionId, contentId, effectiveBatchId, userId, queryClient, contentStateUpdate]);

  return useCallback(
    (event: TelemetryEvent) => {
      if (skipContentStateUpdate) return;
      if (!isEnrolledInCurrentBatch || !collectionId || !contentId || !effectiveBatchId) return;
      if (isBatchEnded) return;
      const isSelfAssess = (contentTypeRef.current ?? "").toLowerCase() === "selfassess";
      const isQuestionSet = (mimeType ?? "").toLowerCase() === "application/vnd.sunbird.questionset";
      const isScorm = (mimeType ?? "").toLowerCase() === "application/vnd.ekstep.scorm-archive";
      if (!isSelfAssess && !isQuestionSet && !isScorm && currentContentStatusRef.current === 2) return;

      const rawEvent = event?.data ?? event;
      const eid = typeof rawEvent === "string" ? "" : (event?.eid ?? (event?.data as any)?.eid ?? event?.type ?? "") as string;
      const eidUpper = eid.toUpperCase();

      // Support renderer:question:submitscore for SelfAssess content (aligned with old portal)
      if (isSelfAssess && event?.data === "renderer:question:submitscore") {
        if (assessmentTsRef.current != null && !sendingAssessmentRef.current) {
          sendingAssessmentRef.current = true;
          void sendAssessmentAndInvalidate();
          lastSentStatusRef.current = null;
          return;
        }
      }

      if (eidUpper === "START") {
        const ets = (rawEvent as any)?.ets ?? event?.ets;
        if (ets != null) assessmentTsRef.current = ets;
        assessEventsRef.current = [];
        if (currentContentStatusRef.current !== 2 && lastSentStatusRef.current !== 1 && !startUpdateInFlightRef.current) {
          startUpdateInFlightRef.current = true;
          handleContentStateUpdate(1, true)
            .then(() => {
              lastSentStatusRef.current = 1;
            })
            .catch(() => {
              /* Already logged in handleContentStateUpdate; ref left null so next START retries */
            })
            .finally(() => {
              startUpdateInFlightRef.current = false;
            });
        }
        return;
      }

      if (eidUpper === "ASSESS") {
        const rawEventData = event?.data ?? event;
        const accumulatedEvent = isScorm
          ? normalizeScormAssessEvent(rawEventData ?? event)
          : (rawEventData ?? event);
        assessEventsRef.current = [...assessEventsRef.current, accumulatedEvent];
        // SCORM's plugin only fires a scored ASSESS once lesson_status is already
        // completed/passed - so this is itself a completion signal, independent of
        // whether END has fired yet (player build ordering isn't reliable).
        if (
          isScorm &&
          eventHasScore(event) &&
          assessmentTsRef.current != null &&
          !sendingAssessmentRef.current
        ) {
          sendingAssessmentRef.current = true;
          void sendAssessmentAndInvalidate();
          lastSentStatusRef.current = null;
        }
        return;
      }

      // QUML_SUMMARY is the QUML player's terminal assessment event.
      // Score and endpageseen are pre-extracted by normalizeQumlPlayerEvent.
      if (eidUpper === "QUML_SUMMARY" && isQuestionSet) {
        const edataQ = (rawEvent as any)?.edata;
        // edata.starttime (surfaced as ets) is a fallback if START telemetry was missed.
        if ((rawEvent as any)?.ets != null && assessmentTsRef.current == null) assessmentTsRef.current = (rawEvent as any).ets as number;
        if (typeof edataQ?.score === "number" && Boolean(edataQ?.endpageseen) && assessmentTsRef.current != null && !sendingAssessmentRef.current) {
          sendingAssessmentRef.current = true;
          void sendAssessmentAndInvalidate();
          lastSentStatusRef.current = null;
        }
        return;
      }

      if (eidUpper === "END") {
        const summary = extractSummary(event);
        if (isSelfAssess || isScorm) {
          // An assessment send may already be in flight (e.g. SCORM's ASSESS-triggered
          // completion above, which can fire before END on some player builds) -
          // nothing left for END to do once that's underway.
          if (sendingAssessmentRef.current) return;
          
          const mergedSummary = (summary as ConsumptionSummary[]).reduce<ConsumptionSummary>((acc, s) => ({ ...acc, ...s }), {});
          const endPageSeen = Boolean(mergedSummary.endpageseen || mergedSummary.visitedcontentend);

          const hasScore =
            eventHasScore(event) ||
            assessEventsRef.current.some((e) => eventHasScore(e as TelemetryEvent));

          if (hasScore && endPageSeen && assessmentTsRef.current != null) {
            sendingAssessmentRef.current = true;
            void sendAssessmentAndInvalidate();
            lastSentStatusRef.current = null;
            return;
          }
          // SCORM completion (lesson_status completed/passed) is independent of score -
          // many SCORM packages have no quiz at all. Complete directly off endpageseen,
          // without going through the assessments path (avoids consuming a maxAttempts
          // slot for content that was never actually scored).
          if (isScorm && endPageSeen && currentContentStatusRef.current !== 2) {
            lastSentStatusRef.current = null;
            void handleContentStateUpdate(2, true);
            return;
          }
          // Completion criteria not met; do not regress an already-completed content.
          if (currentContentStatusRef.current === 2) return;
          const effectiveProgress = calculateContentProgress(summary as ConsumptionSummary[], mimeType ?? "");
          const statusFromProgress = progressToStatus(effectiveProgress);
          const status = Math.min(statusFromProgress, 1);
          if (status === 0 && lastSentStatusRef.current === 1) {
            void handleContentStateUpdate(1, true);
          } else {
            lastSentStatusRef.current = null;
            void handleContentStateUpdate(status, true);
          }
          return;
        }
        const effectiveProgress = calculateContentProgress(summary as ConsumptionSummary[], mimeType ?? "");
        let status = progressToStatus(effectiveProgress);
        if (status === 0 && lastSentStatusRef.current === 1) status = 1;
        lastSentStatusRef.current = null;
        void handleContentStateUpdate(status, true);
      }
    },
    [
      skipContentStateUpdate,
      isEnrolledInCurrentBatch,
      isBatchEnded,
      collectionId,
      contentId,
      effectiveBatchId,
      mimeType,
      handleContentStateUpdate,
      sendAssessmentAndInvalidate,
    ]
  );
}
