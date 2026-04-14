import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { observabilityService } from '../services/reports/ObservabilityService';
import type { LearnerProgressResult } from '../types/reports';

/**
 * Fetches detailed learner progress for a course batch from the Observability API.
 * Only fires when both courseId and batchId are provided.
 */
export function useLearnerProgress(
  courseId: string | undefined,
  batchId: string | undefined
): UseQueryResult<LearnerProgressResult, Error> {
  return useQuery({
    queryKey: ['learnerProgress', courseId, batchId],
    queryFn: () => observabilityService.getLearnerProgress(courseId!, batchId!),
    enabled: !!courseId && !!batchId,
    staleTime: 60_000,
  });
}
