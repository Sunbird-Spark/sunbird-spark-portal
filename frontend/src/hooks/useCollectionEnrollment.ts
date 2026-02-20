import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBatchList, useBatchRead, useContentState } from './useCollection';
import { useUserEnrolledCollections } from './useUserEnrolledCollections';
import { collectionService } from '../services/collection';
import {
  getEnrollmentForCollection,
  getLeafContentIds,
  getContentStatusMap,
  getCourseProgressProps,
  getFirstCertPreviewUrl,
  getEnrollableBatches,
} from '../services/collection/enrollmentMapper';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import type { CollectionData } from '../types/collectionTypes';

export function useCollectionEnrollment(
  collectionId: string | undefined,
  batchIdParam: string | undefined,
  collectionData: CollectionData | null,
  isAuthenticated: boolean,
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: enrollmentsResponse, refetch: refetchEnrollments } = useUserEnrolledCollections({
    enabled: isAuthenticated,
  });

  const enrollmentForCollection = useMemo(
    () => getEnrollmentForCollection(enrollmentsResponse?.data?.courses, collectionId),
    [collectionId, enrollmentsResponse?.data?.courses],
  );
  const hasBatchInRoute = !!batchIdParam;
  const isEnrolledInCurrentBatch =
    !!enrollmentForCollection &&
    (!hasBatchInRoute || enrollmentForCollection.batchId === batchIdParam);
  const effectiveBatchId = batchIdParam ?? enrollmentForCollection?.batchId;

  const leafContentIds = useMemo(() => getLeafContentIds(collectionData), [collectionData]);
  const contentStateRequest = useMemo(() => {
    if (!collectionId || !effectiveBatchId || leafContentIds.length === 0) return null;
    const userId = userAuthInfoService.getUserId();
    if (!userId) return null;
    return {
      userId,
      courseId: collectionId,
      batchId: effectiveBatchId,
      contentIds: leafContentIds,
    };
  }, [collectionId, effectiveBatchId, leafContentIds]);

  const { data: contentStateResponse } = useContentState(contentStateRequest, {
    enabled: isEnrolledInCurrentBatch && contentStateRequest !== null,
  });
  const contentList = contentStateResponse?.data?.contentList ?? [];
  const contentStatusMap = useMemo(() => getContentStatusMap(contentList), [contentList]);
  const completedFromState = contentList.filter((c) => c.status === 2).length;
  const stateIsAuthoritative = contentStateResponse !== undefined;
  const totalFromState = stateIsAuthoritative ? leafContentIds.length : 0;

  const courseProgressProps = useMemo(
    () =>
      getCourseProgressProps(
        enrollmentForCollection,
        collectionData,
        totalFromState,
        completedFromState,
      ),
    [enrollmentForCollection, collectionData, totalFromState, completedFromState],
  );

  const isTrackableForBatch = (collectionData?.trackable?.enabled?.toLowerCase() ?? '') === 'yes';
  const {
    data: batchListResponse,
    isLoading: batchListLoading,
    error: batchListError,
  } = useBatchList(collectionId, {
    enabled: isAuthenticated && isTrackableForBatch && !enrollmentForCollection,
  });
  const rawContent = batchListResponse?.data?.response?.content ?? [];
  const batches = useMemo(
    () => getEnrollableBatches(rawContent, new Date()),
    [rawContent],
  );

  const { data: batchReadResponse } = useBatchRead(
    isEnrolledInCurrentBatch ? effectiveBatchId : undefined,
    { enabled: isEnrolledInCurrentBatch && !!effectiveBatchId },
  );
  const firstCertPreviewUrl = useMemo(
    () => getFirstCertPreviewUrl(batchReadResponse?.data?.response?.cert_templates),
    [batchReadResponse?.data?.response?.cert_templates],
  );
  const hasCertificate = !!firstCertPreviewUrl;

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const handleJoinCourse = async (selectedBatchId: string) => {
    if (!collectionId || !selectedBatchId) return;
    const uid = userAuthInfoService.getUserId();
    if (!uid) return;
    setJoinError('');
    setJoinLoading(true);
    try {
      await collectionService.enrol(collectionId, uid, selectedBatchId);
      await queryClient.invalidateQueries({ queryKey: ['userEnrollments'] });
      refetchEnrollments();
      navigate(`/collection/${collectionId}/batch/${selectedBatchId}`);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Failed to join course.');
    } finally {
      setJoinLoading(false);
    }
  };

  return {
    enrollmentForCollection,
    isEnrolledInCurrentBatch,
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
  };
}
