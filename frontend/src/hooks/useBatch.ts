import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { batchService, Batch, CreateBatchRequest } from '../services/BatchService';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export const useBatchList = (courseId: string | undefined): UseQueryResult<Batch[], Error> => {
  return useQuery({
    queryKey: ['batchList', courseId],
    queryFn: async (): Promise<Batch[]> => {
      if (!courseId) return [];

      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid;
      }

      if (!userId) return [];

      const response = await batchService.listBatches(courseId, userId);
      return response?.data?.response?.content ?? [];
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

/** Data the form hands us — excludes server-resolved fields (createdBy, createdFor) */
export interface CreateBatchFormData {
  courseId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  mentors?: string[];
  tandc: boolean;
  enrollmentEndDate?: string;
}

/**
 * Mutation that resolves the current user's id + rootOrgId and posts to
 * POST /learner/course/v1/batch/create. On success it invalidates the
 * batchList query so BatchCard refreshes automatically.
 */
export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CreateBatchFormData) => {
      // 1. Resolve userId
      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid ?? null;
      }
      if (!userId) throw new Error('User not authenticated');

      // 2. Resolve rootOrgId from full user profile
      const userResponse = await userService.userRead(userId);
      const rootOrgId = (userResponse.data.response as Record<string, unknown>).rootOrgId as
        | string
        | undefined;

      // 3. Build and submit the request
      const request: CreateBatchRequest = {
        courseId: formData.courseId,
        name: formData.name,
        enrollmentType: 'open',
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdBy: userId,
        createdFor: rootOrgId ? [rootOrgId] : [],
        tandc: formData.tandc,
      };
      if (formData.description) request.description = formData.description;
      if (formData.mentors?.length) request.mentors = formData.mentors;
      if (formData.enrollmentEndDate) request.enrollmentEndDate = formData.enrollmentEndDate;

      return batchService.createBatch(request);
    },

    onSuccess: (_data, variables) => {
      // Refresh the batch list for this course
      queryClient.invalidateQueries({ queryKey: ['batchList', variables.courseId] });
    },
  });
};
