import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { LearnService } from '../services/LearnService';
import { CourseEnrollmentResponse } from '../types/courseTypes';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const learnService = new LearnService();

export const useMyLearning = (): UseQueryResult<ApiResponse<CourseEnrollmentResponse>, Error> => {
    return useQuery({
        queryKey: ['my-learning'],
        queryFn: async () => {
            const id = userAuthInfoService.getUserId() ??
                (await userAuthInfoService.getAuthInfo())?.uid;

            if (!id) {
                throw new Error('User ID not available');
            }

            return learnService.getUserEnrollments(id);
        },
        retry: 1,
    });
};
