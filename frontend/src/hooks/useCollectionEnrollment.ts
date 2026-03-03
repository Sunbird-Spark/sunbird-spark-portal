import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBatchListForLearner, useBatchRead, useContentState, useEnrol } from './useBatch';
import { useUserEnrolledCollections } from './useUserEnrolledCollections';
import { useAppI18n } from './useAppI18n';
import { useToast } from './useToast';
import { useTelemetry } from './useTelemetry';
import {
  getEnrollmentForCollection,
  getLeafContentIds,
  getContentStatusMap,
  getContentAttemptInfoMap,
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
  const { t } = useAppI18n();
  const { toast } = useToast();
  const telemetry = useTelemetry();
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
      fields: ['progress', 'score', 'status'],
    };
  }, [collectionId, effectiveBatchId, leafContentIds]);

  const { data: contentStateResponse } = useContentState(contentStateRequest, {
    enabled: isEnrolledInCurrentBatch && contentStateRequest !== null,
  });
  const contentList = contentStateResponse?.data?.contentList ?? [];
  const contentStatusMap = useMemo(() => getContentStatusMap(contentList), [contentList]);
  const contentAttemptInfoMap = useMemo(() => getContentAttemptInfoMap(contentList), [contentList]);
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
  } = useBatchListForLearner(collectionId, {
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
  const batchEnrollmentType = batchReadResponse?.data?.response?.enrollmentType;
  const firstCertPreviewUrl = useMemo(
    () => getFirstCertPreviewUrl(batchReadResponse?.data?.response?.cert_templates),
    [batchReadResponse?.data?.response?.cert_templates],
  );
  const hasCertificate = !!firstCertPreviewUrl;

  const isBatchEnded = useMemo(() => {
    const endDateStr = batchReadResponse?.data?.response?.endDate;
    if (!endDateStr) return false;
    const endMs = new Date(endDateStr).getTime();
    return Number.isFinite(endMs) && endMs < Date.now();
  }, [batchReadResponse?.data?.response?.endDate]);

  const { mutateAsync: enrol, isPending: joinLoading, error: joinErrorMutation, reset: resetEnrol } = useEnrol();
  const handleJoinCourse = async (selectedBatchId: string) => {
    if (!collectionId || !selectedBatchId) return;
    const uid = userAuthInfoService.getUserId();
    if (!uid) return;
    resetEnrol();
    try {
      await enrol({ courseId: collectionId, userId: uid, batchId: selectedBatchId });
      await queryClient.invalidateQueries({ queryKey: ['userEnrollments'] });
      refetchEnrollments();
      toast({
        title: t('success'),
        description: t('courseDetails.enrolSuccess'),
        variant: 'default',
      });
      telemetry.audit({
        edata: {
          props: ['enrollment'],
          prevstate: 'NotEnrolled',
          state: 'Enrolled',
        },
        object: { id: collectionId, type: 'Collection' },
      });
      navigate(`/collection/${collectionId}/batch/${selectedBatchId}`);
    } catch {
      // Error is exposed via joinErrorMutation
    }
  };
  const joinError = joinErrorMutation?.message ?? '';

  return {
    enrollmentForCollection,
    isEnrolledInCurrentBatch,
    effectiveBatchId,
    isBatchEnded,
    contentStatusMap,
    contentAttemptInfoMap,
    courseProgressProps,
    batches,
    batchListLoading,
    batchListError: batchListError?.message,
    firstCertPreviewUrl,
    hasCertificate,
    joinLoading,
    joinError,
    handleJoinCourse,
    batchEnrollmentType,
  };
}
