import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
}: UseInitialCollectionContentNavigationParams): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!collectionData?.hierarchyRoot || contentId) return;

    // For creators or non-trackable collections, navigate to the first leaf content.
    if (!isTrackable || contentCreatorPrivilege) {
      const firstContentId = getFirstLeafContentIdFromHierarchy(collectionData.hierarchyRoot);
      if (!firstContentId || !collectionId) return;
      navigate(`/collection/${collectionId}/content/${firstContentId}`, { replace: true });
      return;
    }

    // Learner view: navigate to the first unconsumed content in the whole course (all units),
    // i.e. first leaf in depth-first order with status !== 2. If all are completed, land on first leaf.
    if (!hasBatchInRoute || !batchIdParam || !isEnrolledInCurrentBatch || !contentStatusMap || !collectionId) {
      return;
    }
    const leafIds = getLeafContentIdsFromHierarchy(collectionData.hierarchyRoot);
    if (!leafIds.length) return;
    const isCompleted = (id: string) => contentStatusMap[id] === 2;
    const firstUnconsumedId = leafIds.find((id) => !isCompleted(id));
    const targetContentId = firstUnconsumedId ?? leafIds[0];
    navigate(`/collection/${collectionId}/batch/${batchIdParam}/content/${targetContentId}`, { replace: true });
  }, [
    collectionData?.hierarchyRoot,
    contentId,
    isTrackable,
    contentCreatorPrivilege,
    hasBatchInRoute,
    batchIdParam,
    isEnrolledInCurrentBatch,
    contentStatusMap,
    collectionId,
    navigate,
  ]);
}

