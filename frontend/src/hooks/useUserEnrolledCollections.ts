import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { userService } from '../services/UserService';
import { CourseEnrollmentResponse } from '../types/TrackableCollections';
import { ApiResponse } from '../lib/http-client';
import { useAuthInfo } from './useAuthInfo';

export interface UseUserEnrolledCollectionsOptions {
  enabled?: boolean;
}

export const useUserEnrolledCollections = (
  options?: UseUserEnrolledCollectionsOptions
): UseQueryResult<ApiResponse<CourseEnrollmentResponse>, Error> => {
  const { enabled = true } = options ?? {};
  const { data: authInfo } = useAuthInfo();
  const userId = authInfo?.uid ?? null;

  return useQuery({
    queryKey: ['userEnrollments', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      return userService.getUserEnrollments(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1
  });
};
