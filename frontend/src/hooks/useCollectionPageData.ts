// Aggregates all server-state needed by CollectionDetailPage: hierarchy, user profile,
// enrollment, and derived flags (isTrackable, contentCreatorPrivilege, contentBlocked).
import { useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import { useUserRead } from "@/hooks/useUserRead";
import { useCollectionEnrollment } from "@/hooks/useCollectionEnrollment";
import { usePermissions } from "@/hooks/usePermission";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import defaultCollectionImage from "@/assets/resource-robot-hand.svg";

export const useCollectionPageData = (collectionId: string | undefined, batchIdParam: string | undefined) => {
  const { isAuthenticated } = usePermissions();
  const { data: collectionDataFromApi, isLoading, isFetching, isError, error, refetch } = useCollection(collectionId);
  const collectionData = collectionDataFromApi ?? null;
  const { data: userReadData } = useUserRead();
  const userProfile = userReadData?.data?.response;
  
  const enrollment = useCollectionEnrollment(collectionId, batchIdParam, collectionData, isAuthenticated);
  
  const currentUserId = userAuthInfoService.getUserId();
  const isCreatorViewingOwnCollection =
    !!isAuthenticated &&
    !!collectionData?.createdBy &&
    !!currentUserId &&
    collectionData.createdBy === currentUserId;
    
  // Only the actual course creator previews without enrolling; merely holding the
  // CONTENT_CREATOR role does not exempt a user from the learner enrollment flow.
  const contentCreatorPrivilege = isCreatorViewingOwnCollection;
  const isTrackable = (collectionDataFromApi?.trackable?.enabled?.toLowerCase() ?? "") === "yes";
  const contentBlocked = isTrackable && (
    !isAuthenticated
    || (!contentCreatorPrivilege && !(!!batchIdParam && enrollment.isEnrolledInCurrentBatch))
  );

  const displayCollectionData = useMemo(
    () => (collectionData ? { ...collectionData, image: collectionData.image || defaultCollectionImage } : null),
    [collectionData]
  );

  return {
    isAuthenticated,
    collectionDataFromApi,
    collectionData,
    userProfile,
    enrollment,
    currentUserId,
    isCreatorViewingOwnCollection,
    contentCreatorPrivilege,
    isTrackable,
    contentBlocked,
    displayCollectionData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};
