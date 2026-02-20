import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { userService } from '../services/UserService';
import { CourseEnrollmentResponse } from '../types/TrackableCollections';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export const useUserEnrolledCollections = (): UseQueryResult<ApiResponse<CourseEnrollmentResponse>, Error> => {
  return useQuery({
    queryKey: ['userEnrollments'],
    queryFn: async () => {
      let userId = userAuthInfoService.getUserId();
      
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo.uid;
      }

      if (!userId) {
        throw new Error("User not authenticated");
      }

      return userService.getUserEnrollments(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1
  });
};
