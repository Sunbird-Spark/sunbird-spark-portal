import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useContentStateUpdateMutation } from "./useBatch";
import {
  calculateContentProgress,
  progressToStatus,
} from "../services/collection/contentProgressCalculator";
import type { ConsumptionSummary } from "../services/collection/contentProgressCalculator";
import userAuthInfoService from "../services/userAuthInfoService/userAuthInfoService";

interface UseContentStateUpdateParams {
  collectionId: string | undefined;
  contentId: string | undefined;
  effectiveBatchId: string | undefined;
  isEnrolledInCurrentBatch: boolean;
  /** When true, no state update API calls are made (batch end date has passed; content is view-only). */
  isBatchEnded?: boolean;
  mimeType: string | undefined;
  /** If 2 (completed), no API calls are made for START/END to avoid overwriting completed state. */
  currentContentStatus?: number;
}

/** Telemetry callback receives the raw player detail (e.g. { eid, edata }), not { type, data }. */
type TelemetryEvent = {
  eid?: string;
  type?: string;
  edata?: { summary?: ConsumptionSummary[] };
  summary?: ConsumptionSummary | ConsumptionSummary[];
  data?: {
    eid?: string;
    edata?: { summary?: ConsumptionSummary[] };
    summary?: ConsumptionSummary | ConsumptionSummary[];
  };
};

export function useContentStateUpdate({
  collectionId,
  contentId,
  effectiveBatchId,
  isEnrolledInCurrentBatch,
  isBatchEnded = false,
  mimeType,
  currentContentStatus,
}: UseContentStateUpdateParams): (event: TelemetryEvent) => void {
  const queryClient = useQueryClient();
  const { mutateAsync: contentStateUpdate } = useContentStateUpdateMutation();
  const lastSentStatusRef = useRef<number | null>(null);

  useEffect(() => {
    lastSentStatusRef.current = null;
  }, [contentId]);

  const handleContentStateUpdate = useCallback(
    async (status: number, invalidate: boolean) => {
      if (!collectionId || !contentId || !effectiveBatchId) return;
      const userId = userAuthInfoService.getUserId();
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
      }
    },
    [collectionId, contentId, effectiveBatchId, queryClient, contentStateUpdate]
  );

  return useCallback(
    (event: TelemetryEvent) => {
      if (!isEnrolledInCurrentBatch || !collectionId || !contentId || !effectiveBatchId) return;
      if (isBatchEnded) return;
      if (currentContentStatus === 2) return;

      const eid = (event?.eid ?? event?.data?.eid ?? event?.type ?? "") as string;
      const eidUpper = eid.toUpperCase();

      if (eidUpper === "START") {
        if (lastSentStatusRef.current !== 1) {
          lastSentStatusRef.current = 1;
          void handleContentStateUpdate(1, false);
        }
        return;
      }

      if (eidUpper === "END") {
        const rawSummary =
          event?.edata?.summary ??
          event?.data?.edata?.summary ??
          event?.summary ??
          event?.data?.summary;
        const summary = Array.isArray(rawSummary) ? rawSummary : rawSummary ? [rawSummary] : [];
        const effectiveProgress = calculateContentProgress(summary as ConsumptionSummary[], mimeType ?? "");
        let status = progressToStatus(effectiveProgress);
        if (status === 0 && lastSentStatusRef.current === 1) status = 1;
        lastSentStatusRef.current = null;
        void handleContentStateUpdate(status, true);
      }
    },
    [
      isEnrolledInCurrentBatch,
      isBatchEnded,
      collectionId,
      contentId,
      effectiveBatchId,
      mimeType,
      currentContentStatus,
      handleContentStateUpdate,
    ]
  );
}
