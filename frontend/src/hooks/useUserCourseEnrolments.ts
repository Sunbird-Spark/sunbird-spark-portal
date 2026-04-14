import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { observabilityService } from '../services/reports/ObservabilityService';
import type { UserCourseEnrolmentResult } from '../types/reports';
import { useCurrentUserId } from './useUser';

/**
 * Fetches all course enrolments for the currently logged-in user.
 * Resolves the user ID from auth info — no external prop required.
 */
export const useUserCourseEnrolments = (): UseQueryResult<UserCourseEnrolmentResult, Error> => {
  const { data: userId } = useCurrentUserId();

  return useQuery({
    queryKey: ['userCourseEnrolments', userId],
    queryFn: () => observabilityService.getUserCourseEnrolments(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
};
