import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { batchService, Batch, CreateBatchRequest, UpdateBatchRequest } from '../services/BatchService';
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
    staleTime: 0,
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
  issueCertificate?: boolean;
}

/** Data for updating an existing batch */
export interface UpdateBatchFormData {
  batchId: string;
  courseId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  mentors?: string[];
  enrollmentEndDate?: string;
  issueCertificate?: boolean;
}

async function resolveUserAndOrg() {
  let userId = userAuthInfoService.getUserId();
  if (!userId) {
    const authInfo = await userAuthInfoService.getAuthInfo();
    userId = authInfo?.uid ?? null;
  }
  if (!userId) throw new Error('User not authenticated');

  const userResponse = await userService.userRead(userId);
  const rootOrgId = (userResponse.data.response as Record<string, unknown>).rootOrgId as
    | string
    | undefined;

  return { userId, rootOrgId };
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
      const { userId, rootOrgId } = await resolveUserAndOrg();

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
      if (formData.issueCertificate !== undefined) request.issueCertificate = formData.issueCertificate;

      const reqHeaders: Record<string, string> = {
        'X-User-ID': userId,
      };
      if (rootOrgId) {
        reqHeaders['X-Channel-Id'] = rootOrgId;
      }

      return batchService.createBatch(request, reqHeaders);
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchList', variables.courseId] });
    },
  });
};

/**
 * Mutation that resolves the current user's rootOrgId and patches
 * PATCH /learner/course/v1/batch/update. On success it invalidates the
 * batchList query so BatchCard refreshes automatically.
 */
export const useUpdateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: UpdateBatchFormData) => {
      const { userId, rootOrgId } = await resolveUserAndOrg();

      const request: UpdateBatchRequest = {
        id: formData.batchId,
        courseId: formData.courseId,
        name: formData.name,
        enrollmentType: 'open',
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdFor: rootOrgId ? [rootOrgId] : [],
        mentors: formData.mentors ?? [],
      };
      if (formData.description) request.description = formData.description;
      if (formData.enrollmentEndDate) request.enrollmentEndDate = formData.enrollmentEndDate;
      if (formData.issueCertificate !== undefined) request.issueCertificate = formData.issueCertificate;

      const reqHeaders: Record<string, string> = {
        'X-User-ID': userId,
      };
      if (rootOrgId) {
        reqHeaders['X-Channel-Id'] = rootOrgId;
        reqHeaders['X-Org-code'] = rootOrgId;
      }

      return batchService.updateBatch(request, reqHeaders);
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchList', variables.courseId] });
    },
  });
};
