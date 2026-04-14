import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { observabilityService } from '../services/reports/ObservabilityService';
import type { AssessmentResult } from '../types/reports';

/**
 * Fetches assessment summary for all learners in a course from the Observability API.
 * Only fires when courseId is provided.
 */
export function useAssessmentData(
  courseId: string | undefined
): UseQueryResult<AssessmentResult, Error> {
  return useQuery({
    queryKey: ['assessmentData', courseId],
    queryFn: () => observabilityService.getCourseAssessments(courseId!),
    enabled: !!courseId,
    staleTime: 60_000,
  });
}
