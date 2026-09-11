import { useCallback } from "react";
import { useContentPlayer } from "./useContentPlayer";
import { useContentStateUpdate } from "./useContentStateUpdate";
import { normalizeQumlPlayerEvent } from "../services/players/playerEventNormalizer";

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
  /** When true, attempts are exhausted: completion status still updates, but no score/assessment is persisted. */
  maxAttemptsExceeded?: boolean;
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
  maxAttemptsExceeded,
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
    maxAttemptsExceeded,
  });

  const onTelemetryEventStable = useCallback(
    (event: unknown) => {
      handleContentStateFromTelemetry(event as Parameters<typeof handleContentStateFromTelemetry>[0]);
    },
    [handleContentStateFromTelemetry]
  );

  // Route QUML playerEvents (e.g. QUML_SUMMARY) through the normalizer so
  // useContentStateUpdate receives a unified event shape. Standard telemetry
  // events (ASSESS, START, END) arrive via onTelemetryEvent and are unchanged.
  const onPlayerEventStable = useCallback(
    (event: unknown) => {
      const normalized = normalizeQumlPlayerEvent(event);
      handleContentStateFromTelemetry(normalized as Parameters<typeof handleContentStateFromTelemetry>[0]);
    },
    [handleContentStateFromTelemetry]
  );

  return useContentPlayer({
    onTelemetryEvent: onTelemetryEventStable,
    onPlayerEvent: onPlayerEventStable,
    enableLogging: false,
  });
}
