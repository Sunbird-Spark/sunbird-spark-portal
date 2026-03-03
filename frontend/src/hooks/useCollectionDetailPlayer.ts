import { useCallback } from "react";
import { useContentPlayer } from "./useContentPlayer";
import { useContentStateUpdate } from "./useContentStateUpdate";

interface UseCollectionDetailPlayerParams {
  collectionId: string | undefined;
  contentId: string | undefined;
  effectiveBatchId: string | undefined;
  isEnrolledInCurrentBatch: boolean;
  /** When true, no progress/state update API calls are made (batch end date passed). */
  isBatchEnded?: boolean;
  mimeType: string | undefined;
  /** Current content status (0/1/2). When 2, no progress API calls are made for START/END. */
  currentContentStatus?: number;
  /** When true (e.g. creator viewing own collection), no progress/state API calls are made. */
  skipContentStateUpdate?: boolean;
  contentType?: string;
}

export function useCollectionDetailPlayer({
  collectionId,
  contentId,
  effectiveBatchId,
  isEnrolledInCurrentBatch,
  isBatchEnded,
  mimeType,
  currentContentStatus,
  skipContentStateUpdate,
  contentType,
}: UseCollectionDetailPlayerParams) {
  const handleContentStateFromTelemetry = useContentStateUpdate({
    collectionId,
    contentId,
    effectiveBatchId,
    isEnrolledInCurrentBatch,
    isBatchEnded,
    mimeType,
    currentContentStatus,
    skipContentStateUpdate,
    contentType,
  });

  const onTelemetryEventStable = useCallback(
    (event: unknown) => {
      handleContentStateFromTelemetry(event as Parameters<typeof handleContentStateFromTelemetry>[0]);
    },
    [handleContentStateFromTelemetry]
  );

  return useContentPlayer({
    onTelemetryEvent: onTelemetryEventStable,
    enableLogging: false,
  });
}
