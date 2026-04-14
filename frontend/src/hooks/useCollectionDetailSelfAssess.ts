import { useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { findNodeById } from "@/services/collection/hierarchyTree";
import { isSelfAssess } from "@/services/collection/enrollmentMapper";
import { useToast } from "@/hooks/useToast";
import type { HierarchyContentNode } from "@/types/collectionTypes";
import type { ContentAttemptInfo } from "@/services/collection/enrollmentMapper";

interface UseCollectionDetailSelfAssessParams {
  contentId: string | undefined;
  collectionData: { hierarchyRoot?: HierarchyContentNode } | null;
  hasBatchInRoute: boolean;
  isEnrolledInCurrentBatch: boolean;
  contentCreatorPrivilege: boolean;
  contentAttemptInfoMap: Record<string, ContentAttemptInfo>;
  rawPlayerMetadata: unknown;
  playerIsLoading: boolean;
  t: (key: string) => string;
}

export function useCollectionDetailSelfAssess({
  contentId,
  collectionData,
  hasBatchInRoute,
  isEnrolledInCurrentBatch,
  contentCreatorPrivilege,
  contentAttemptInfoMap,
  rawPlayerMetadata,
  playerIsLoading,
  t,
}: UseCollectionDetailSelfAssessParams) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const lastAttemptToastShownRef = useRef(false);

  const currentContentNode = useMemo(
    () => (contentId && collectionData?.hierarchyRoot ? findNodeById(collectionData.hierarchyRoot, contentId) : undefined),
    [contentId, collectionData?.hierarchyRoot]
  );
  const selfAssessWithBatch = Boolean(
    currentContentNode && isSelfAssess(currentContentNode) && hasBatchInRoute && isEnrolledInCurrentBatch && !contentCreatorPrivilege
  );
  const attemptInfo = contentId ? contentAttemptInfoMap?.[contentId] : undefined;
  const attemptCount = attemptInfo?.attemptCount ?? 0;
  const maxAttempts = currentContentNode?.maxAttempts;
  const maxAttemptsExceeded = Boolean(
    selfAssessWithBatch &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    attemptCount >= maxAttempts
  );

  const attemptCountForPlayerRef = useRef(attemptCount);
  const prevContentIdRef = useRef(contentId);
  if (prevContentIdRef.current !== contentId) {
    // User navigated to different content — pick up the fresh count.
    prevContentIdRef.current = contentId;
    attemptCountForPlayerRef.current = attemptCount;
  } else if (attemptCountForPlayerRef.current === 0 && attemptCount > 0) {
    // Initial server data arrived (was 0/loading, now has real value).
    attemptCountForPlayerRef.current = attemptCount;
  }

  const playerMetadata = useMemo((): Record<string, unknown> | undefined => {
    if (!rawPlayerMetadata) return undefined;
    const base = rawPlayerMetadata as Record<string, unknown>;
    if (!selfAssessWithBatch || maxAttemptsExceeded) return base;
    return {
      ...base,
      maxAttempt: maxAttempts,
      currentAttempt: attemptCountForPlayerRef.current,
    };
  }, [rawPlayerMetadata, selfAssessWithBatch, maxAttemptsExceeded, maxAttempts]);

  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  const isLastAttemptForPlayer = Boolean(
    selfAssessWithBatch &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    maxAttempts - attemptCount === 1 &&
    !maxAttemptsExceeded
  );

  useEffect(() => {
    if (!contentId || !isLastAttemptForPlayer || !playerMetadata || playerIsLoading) return;
    if (lastAttemptToastShownRef.current) return;
    lastAttemptToastShownRef.current = true;
    toast({ title: t("courseDetails.selfAssessLastAttempt"), variant: "default", viewport: "center" });
  }, [contentId, isLastAttemptForPlayer, playerMetadata, playerIsLoading, toast, t]);
  useEffect(() => {
    lastAttemptToastShownRef.current = false;
  }, [contentId]);

  return {
    maxAttemptsExceeded,
    playerMetadata,
    handleGoBack,
    currentContentNode,
  };
}
