import { useCallback } from "react";
import { useContentPlayer } from "./useContentPlayer";
import { useContentStateUpdate } from "./useContentStateUpdate";
import { useContentView } from "./useContentView";
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
  /** When true (e.g. creator viewing own collection), no progress/state update API calls are made. */
  skipContentStateUpdate?: boolean;
  contentType?: string;
  /** When true, attempts are exhausted: completion status still updates, but no score/assessment is persisted. */
  maxAttemptsExceeded?: boolean;
  /**
   * True when the course is opened from within a Learning Path (`?lp=`, see
   * AppRoutes). Routes progress writes through the Viewer Service
   * (`useContentView`) instead of the legacy `content/state/update`
   * (`useContentStateUpdate`); `effectiveBatchId` is already the composite
   * `<lpContextId>:<courseId>` context id in this case. Every other course
   * entry point (this flag false/absent) is byte-identical to before.
   */
  isLearningPathContext?: boolean;
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
  isLearningPathContext = false,
}: UseCollectionDetailPlayerParams) {
  const handleContentStateUpdate = useContentStateUpdate({
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
  // Always called (rules of hooks) - only invoked below when isLearningPathContext is true.
  const handleContentView = useContentView({
    collectionId,
    contentId,
    contextId: effectiveBatchId,
    isEnrolledInCurrentBatch,
    isBatchEnded,
    mimeType,
    currentContentStatus,
    skipContentStateUpdate,
    contentType,
  });
  const handleContentStateFromTelemetry = isLearningPathContext ? handleContentView : handleContentStateUpdate;

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
