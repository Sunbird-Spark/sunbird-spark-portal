import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBatchListForLearner, useBatchRead, useEnrol, useUnenrol } from './useBatch';
import { getEnrollableBatches, getFirstCertPreviewUrl } from '../services/collection/enrollmentMapper';
import { useAppI18n } from './useAppI18n';
import { useToast } from './useToast';
import { useTelemetry } from './useTelemetry';
import { useUserId } from './useAuthInfo';
import { getPathSummary } from '../services/viewer/summaryMapper';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

/**
 * Learning Path analogue of `useCollectionEnrollment`: the learner enrols in
 * a batch on the Learning Path itself (see plan §4). Enrolment/batch APIs are
 * still the learner service — only progress reads move to the Viewer Service.
 */
export function useLearningPathEnrollment(
  pathId: string | undefined,
  contextIdParam: string | undefined,
  summaryRecords: ViewerSummaryRecord[],
  isAuthenticated: boolean
) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useAppI18n();
  const { toast } = useToast();
  const userId = useUserId();
  const telemetry = useTelemetry();

  const pathSummary = useMemo(
    () => getPathSummary(summaryRecords, pathId, contextIdParam),
    [summaryRecords, pathId, contextIdParam]
  );
  const isEnrolled = !!pathSummary;
  const effectiveContextId = contextIdParam ?? pathSummary?.contextId;

  const {
    data: batchListResponse,
    isLoading: batchListLoading,
    error: batchListError,
  } = useBatchListForLearner(pathId, { enabled: isAuthenticated && !isEnrolled });
  const rawContent = batchListResponse?.data?.response?.content ?? [];
  const batches = useMemo(() => getEnrollableBatches(rawContent, new Date()), [rawContent]);

  const { data: batchReadResponse } = useBatchRead(isEnrolled ? effectiveContextId : undefined, {
    enabled: isEnrolled && !!effectiveContextId,
  });
  const batchEndDate = batchReadResponse?.data?.response?.endDate;
  const isBatchEnded = useMemo(() => {
    if (!batchEndDate) return false;
    const endMs = new Date(batchEndDate).getTime();
    return Number.isFinite(endMs) && endMs < Date.now();
  }, [batchEndDate]);
  const isBatchUpcoming = useMemo(() => {
    const startDateStr = batchReadResponse?.data?.response?.startDate;
    if (!startDateStr) return false;
    return new Date(startDateStr).getTime() > Date.now();
  }, [batchReadResponse?.data?.response?.startDate]);

  const certificates = useMemo(
    () => getFirstCertPreviewUrl(batchReadResponse?.data?.response?.cert_templates),
    [batchReadResponse?.data?.response?.cert_templates]
  );

  const { mutateAsync: enrol, isPending: enrolLoading, error: enrolErrorMutation, reset: resetEnrol } = useEnrol();
  const { mutateAsync: unenrol } = useUnenrol();

  const handleEnrol = async (contextId: string) => {
    if (!pathId || !contextId || !userId) return;
    resetEnrol();
    try {
      await enrol({ courseId: pathId, userId, batchId: contextId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['viewerSummary', userId] }),
        queryClient.invalidateQueries({ queryKey: ['userEnrollments'] }),
      ]);
      toast({
        title: t('success'),
        description: t('learningPath.enrolled'),
        variant: 'success',
      });
      telemetry.audit({
        edata: { props: ['enrollment'], prevstate: 'NotEnrolled', state: 'Enrolled' },
        object: { id: pathId, type: 'Learning Path' },
      });
      navigate(`/learning-path/${pathId}/batch/${contextId}`, { state: location.state });
    } catch {
      // Error is exposed via enrolError below.
    }
  };

  const handleUnenrol = async () => {
    if (!pathId || !effectiveContextId || !userId) return;
    await unenrol({ courseId: pathId, userId, batchId: effectiveContextId });
    await queryClient.invalidateQueries({ queryKey: ['viewerSummary', userId] });
  };

  return {
    isEnrolled,
    effectiveContextId,
    batches,
    batchListLoading,
    batchListError: batchListError?.message,
    isBatchEnded,
    isBatchUpcoming,
    batchEndDate,
    certificates,
    enrolLoading,
    enrolError: enrolErrorMutation?.message ?? '',
    handleEnrol,
    handleUnenrol,
  };
}
