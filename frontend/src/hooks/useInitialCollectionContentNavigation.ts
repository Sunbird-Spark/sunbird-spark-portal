import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirstLeafContentIdFromHierarchy, getLeafContentIdsFromHierarchy } from "@/services/collection/hierarchyTree";
import { CONTENT_STATUS } from "@/types/collectionTypes";
import type { CollectionData } from "@/types/collectionTypes";

interface UseInitialCollectionContentNavigationParams {
  collectionData: CollectionData | null;
  contentId: string | undefined;
  isTrackable: boolean;
  contentCreatorPrivilege: boolean;
  collectionId: string | undefined;
  hasBatchInRoute: boolean;
  batchIdParam: string | undefined;
  isEnrolledInCurrentBatch: boolean;
  contentStatusMap: Record<string, number> | undefined;
  /** When false, wait before running learner "first unconsumed" navigation (content state not yet loaded). */
  contentStateFetched: boolean;
  /** Leaf ids locked by sequential access, from `useCollectionEnrollment`. */
  lockedContentIds?: Set<string>;
}

export function useInitialCollectionContentNavigation({
  collectionData,
  contentId,
  isTrackable,
  contentCreatorPrivilege,
  collectionId,
  hasBatchInRoute,
  batchIdParam,
  isEnrolledInCurrentBatch,
  contentStatusMap,
  contentStateFetched,
  lockedContentIds,
}: UseInitialCollectionContentNavigationParams): void {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Everything both learner effects below need, or null when learner navigation
   * doesn't apply at all (creator/mentor, non-trackable collection, not enrolled,
   * content state not loaded yet, empty course).
   *
   * Returned as an object rather than a boolean so the narrowed `collectionId` and
   * `batchIdParam` survive into the effects, and so the hierarchy is walked once
   * here instead of separately in each effect.
   */
  const learnerNav = useMemo(() => {
    const hierarchyRoot = collectionData?.hierarchyRoot;
    if (!hierarchyRoot || !isTrackable || contentCreatorPrivilege) return null;
    if (!hasBatchInRoute || !batchIdParam || !isEnrolledInCurrentBatch) return null;
    if (!contentStatusMap || !collectionId || !contentStateFetched) return null;

    const leafIds = getLeafContentIdsFromHierarchy(hierarchyRoot);
    if (!leafIds.length) return null;

    // First leaf in depth-first order with status !== 2. If all are completed, the first leaf.
    const firstUnconsumedId =
      leafIds.find((id) => contentStatusMap[id] !== CONTENT_STATUS.Completed) ?? leafIds[0];
    if (!firstUnconsumedId) return null;

    return {
      url: `/collection/${collectionId}/batch/${batchIdParam}/content/${firstUnconsumedId}`,
      firstUnconsumedId,
    };
  }, [
    collectionData?.hierarchyRoot,
    isTrackable,
    contentCreatorPrivilege,
    hasBatchInRoute,
    batchIdParam,
    isEnrolledInCurrentBatch,
    contentStatusMap,
    collectionId,
    contentStateFetched,
  ]);

  // No content selected in the URL: land on the right starting point.
  useEffect(() => {
    if (!collectionData?.hierarchyRoot || contentId) return;

    // For creators or non-trackable collections, navigate to the first leaf content.
    if (!isTrackable || contentCreatorPrivilege) {
      const firstContentId = getFirstLeafContentIdFromHierarchy(collectionData.hierarchyRoot);
      if (!firstContentId || !collectionId) return;
      navigate(`/collection/${collectionId}/content/${firstContentId}`, { replace: true, state: location.state });
      return;
    }

    // Learner view: the first unconsumed content in the whole course (all units). Waits for
    // content state so we don't land on the first leaf while the status map is still empty.
    if (!learnerNav) return;
    navigate(learnerNav.url, { replace: true, state: location.state });
  }, [
    collectionData?.hierarchyRoot,
    contentId,
    isTrackable,
    contentCreatorPrivilege,
    collectionId,
    learnerNav,
    location.state,
    navigate,
  ]);

  // Sequential access enforcement. The effect above only runs when the URL carries no
  // contentId, so it can't cover a pasted or bookmarked link to a locked content — that
  // URL is directly routable and the player would otherwise just load it. Bounce it to
  // the first unconsumed content instead.
  useEffect(() => {
    if (!contentId || !learnerNav) return;
    if (!lockedContentIds?.has(contentId)) return;
    if (learnerNav.firstUnconsumedId === contentId) return;
    // The redirect target is never locked today (the first unconsumed leaf is always open).
    // Bail rather than trust that, so a future change to the lock rule degrades into no
    // enforcement instead of a redirect loop.
    if (lockedContentIds.has(learnerNav.firstUnconsumedId)) return;
    navigate(learnerNav.url, { replace: true, state: location.state });
  }, [contentId, learnerNav, lockedContentIds, location.state, navigate]);
}
