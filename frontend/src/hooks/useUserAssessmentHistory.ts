import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { observabilityService } from '../services/reports/ObservabilityService';
import type { UserAssessmentResult } from '../types/reports';
import { useCurrentUserId } from './useUser';

/**
 * Fetches assessment history for the currently logged-in user from the Observability API.
 * Resolves the user ID from auth info — no external prop required.
 */
export function useUserAssessmentHistory(): UseQueryResult<UserAssessmentResult, Error> {
  const { data: userId } = useCurrentUserId();

  return useQuery({
    queryKey: ['userAssessmentHistory', userId],
    queryFn: () => observabilityService.getUserAssessments(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
