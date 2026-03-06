import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getFirstLeafContentIdFromHierarchy } from "@/services/collection/hierarchyTree";

interface UseCollectionAutoNavigateProps {
  collectionId: string | undefined;
  contentId: string | undefined;
  collectionData: any;
  hasBatchInRoute: boolean;
  batchIdParam: string | undefined;
  isTrackable: boolean;
  contentCreatorPrivilege: boolean;
  enrollment: any;
}

export const useCollectionAutoNavigate = ({
  collectionId,
  contentId,
  collectionData,
  hasBatchInRoute,
  batchIdParam,
  isTrackable,
  contentCreatorPrivilege,
  enrollment,
}: UseCollectionAutoNavigateProps) => {
  const navigate = useNavigate();
  const initialExpandedSet = useRef(false);

  // Redirect to batch if needed
  useEffect(() => {
    if (!collectionId || hasBatchInRoute || contentCreatorPrivilege) return;
    const batchId = enrollment.enrollmentForCollection?.batchId;
    if (batchId) navigate(`/collection/${collectionId}/batch/${batchId}`, { replace: true });
  }, [collectionId, hasBatchInRoute, contentCreatorPrivilege, enrollment.enrollmentForCollection?.batchId, navigate]);

  // Auto-navigate to first content when collection loads without a selected contentId
  useEffect(() => {
    if (!collectionData?.hierarchyRoot || contentId) return;
    const firstContentId = getFirstLeafContentIdFromHierarchy(collectionData.hierarchyRoot);
    if (!firstContentId) return;
    if (!isTrackable || contentCreatorPrivilege) {
      navigate(`/collection/${collectionId}/content/${firstContentId}`, { replace: true });
      return;
    }
    if (hasBatchInRoute && batchIdParam) {
      navigate(`/collection/${collectionId}/batch/${batchIdParam}/content/${firstContentId}`, { replace: true });
    }
  }, [contentId, collectionData?.hierarchyRoot, collectionId, navigate, isTrackable, contentCreatorPrivilege, hasBatchInRoute, batchIdParam]);

  return { initialExpandedSet };
};
