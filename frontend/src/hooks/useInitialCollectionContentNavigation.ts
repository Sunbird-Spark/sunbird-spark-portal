import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirstLeafContentIdFromHierarchy, getLeafContentIdsFromHierarchy } from "@/services/collection/hierarchyTree";
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
}: UseInitialCollectionContentNavigationParams): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!collectionData?.hierarchyRoot || contentId) return;

    // For creators or non-trackable collections, navigate to the first leaf content.
    if (!isTrackable || contentCreatorPrivilege) {
      const firstContentId = getFirstLeafContentIdFromHierarchy(collectionData.hierarchyRoot);
      if (!firstContentId || !collectionId) return;
      navigate(`/collection/${collectionId}/content/${firstContentId}`, { replace: true, state: location.state });
      return;
    }

    // Learner view: navigate to the first unconsumed content in the whole course (all units),
    // i.e. first leaf in depth-first order with status !== 2. If all are completed, land on first leaf.
    // Wait for content state to be fetched so we don't navigate to first leaf when map is still empty on first load.
    if (!hasBatchInRoute || !batchIdParam || !isEnrolledInCurrentBatch || !contentStatusMap || !collectionId || !contentStateFetched) {
      return;
    }
    const leafIds = getLeafContentIdsFromHierarchy(collectionData.hierarchyRoot);
    if (!leafIds.length) return;
    const isCompleted = (id: string) => contentStatusMap[id] === 2;
    const firstUnconsumedId = leafIds.find((id) => !isCompleted(id));
    const targetContentId = firstUnconsumedId ?? leafIds[0];
    navigate(`/collection/${collectionId}/batch/${batchIdParam}/content/${targetContentId}`, { replace: true, state: location.state });
  }, [
    collectionData?.hierarchyRoot,
    contentId,
    isTrackable,
    contentCreatorPrivilege,
    hasBatchInRoute,
    batchIdParam,
    isEnrolledInCurrentBatch,
    contentStatusMap,
    contentStateFetched,
    collectionId,
    location.state,
    navigate,
  ]);
}

