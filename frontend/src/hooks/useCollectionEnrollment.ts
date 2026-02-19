import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useBatchList, useBatchRead, useContentState } from "./useCollection";
import { useUserEnrolledCollections } from "./useUserEnrolledCollections";
import { collectionService } from "../services/collection";
import {
  getEnrollmentForCollection,
  getLeafContentIds,
  getContentStatusMap,
  getCourseProgressProps,
  getFirstCertPreviewUrl,
} from "../services/collection/enrollmentMapper";
import userAuthInfoService from "../services/userAuthInfoService/userAuthInfoService";
import type { CollectionData } from "../types/collectionTypes";

export function useCollectionEnrollment(
  collectionId: string | undefined,
  batchIdParam: string | undefined,
  collectionData: CollectionData | null,
  isAuthenticated: boolean
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: enrollmentsResponse, refetch: refetchEnrollments } = useUserEnrolledCollections({
    enabled: isAuthenticated,
  });

  const enrollmentForCollection = useMemo(
    () => getEnrollmentForCollection(enrollmentsResponse?.data?.courses, collectionId),
    [collectionId, enrollmentsResponse?.data?.courses]
  );
  const isEnrolled = !!enrollmentForCollection;
  const effectiveBatchId = enrollmentForCollection?.batchId ?? batchIdParam;

  const leafContentIds = useMemo(() => getLeafContentIds(collectionData), [collectionData]);
  const contentStateRequest = useMemo(() => {
    if (!collectionId || !effectiveBatchId || leafContentIds.length === 0) return null;
    const userId = userAuthInfoService.getUserId();
    if (!userId) return null;
    return { userId, courseId: collectionId, batchId: effectiveBatchId, contentIds: leafContentIds };
  }, [collectionId, effectiveBatchId, leafContentIds]);

  const { data: contentStateResponse } = useContentState(contentStateRequest, {
    enabled: isEnrolled && contentStateRequest !== null,
  });
  const contentList = contentStateResponse?.data?.contentList ?? [];
  const contentStatusMap = useMemo(() => getContentStatusMap(contentList), [contentList]);
  const completedFromState = contentList.filter((c) => c.status === 2).length;
  const totalFromState = leafContentIds.length;

  const courseProgressProps = useMemo(
    () =>
      getCourseProgressProps(
        enrollmentForCollection,
        collectionData,
        totalFromState,
        completedFromState
      ),
    [enrollmentForCollection, collectionData, totalFromState, completedFromState]
  );

  const isTrackableForBatch = (collectionData?.trackable?.enabled?.toLowerCase() ?? "") === "yes";
  const { data: batchListResponse, isLoading: batchListLoading, error: batchListError } = useBatchList(
    collectionId,
    { enabled: !isEnrolled && isAuthenticated && isTrackableForBatch }
  );
  const batches = batchListResponse?.data?.response?.content ?? [];

  const { data: batchReadResponse } = useBatchRead(isEnrolled ? effectiveBatchId : undefined, {
    enabled: isEnrolled && !!effectiveBatchId,
  });
  const firstCertPreviewUrl = useMemo(
    () => getFirstCertPreviewUrl(batchReadResponse?.data?.response?.cert_templates),
    [batchReadResponse?.data?.response?.cert_templates]
  );
  const hasCertificate = !!firstCertPreviewUrl;

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const handleJoinCourse = async () => {
    const uid = userAuthInfoService.getUserId();
    if (!collectionId || !effectiveBatchId || !uid) return;
    setJoinError("");
    setJoinLoading(true);
    try {
      await collectionService.enrol(collectionId, uid, effectiveBatchId);
      await queryClient.invalidateQueries({ queryKey: ["userEnrollments"] });
      refetchEnrollments();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Failed to join course.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleBatchSelect = (batchId: string) => {
    if (!collectionId) return;
    navigate(batchId ? `/collection/${collectionId}/batch/${batchId}` : `/collection/${collectionId}`);
  };

  return {
    enrollmentForCollection,
    isEnrolled,
    effectiveBatchId,
    contentStatusMap,
    courseProgressProps,
    batches,
    batchListLoading,
    batchListError: batchListError?.message,
    firstCertPreviewUrl,
    hasCertificate,
    joinLoading,
    joinError,
    handleJoinCourse,
    handleBatchSelect,
  };
}
