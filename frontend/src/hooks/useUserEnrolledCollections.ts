import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { userService } from '../services/UserService';
import { CourseEnrollmentResponse } from '../types/TrackableCollections';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export const useUserEnrolledCollections = (): UseQueryResult<ApiResponse<CourseEnrollmentResponse>, Error> => {
  const userId = userAuthInfoService.getUserId();

  return useQuery({
    queryKey: ['userEnrollments', userId],
    queryFn: () => userService.getUserEnrollments(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1
  });
};
