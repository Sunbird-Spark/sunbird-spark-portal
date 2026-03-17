import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { batchService as creatorBatchService, Batch, CreateBatchRequest, UpdateBatchRequest } from '../services/BatchService';
import { BatchService as LearnerBatchService } from '../services/collection/BatchService';
import { useAuthInfo } from './useAuthInfo';
import { resolveUserAndOrg } from '../utils/userUtils';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import type {
  BatchListResponse,
  BatchReadResponse,
  ContentStateReadRequest,
  ContentStateReadResponse,
  ContentStateUpdateRequest,
} from '../types/collectionTypes';
import type { ApiResponse } from '../lib/http-client';

// ─── Shared learner batch service instance ───────────────────────────────────
const learnerBatchService = new LearnerBatchService();

// ─── Params ──────────────────────────────────────────────────────────────────
export type EnrolParams = { courseId: string; userId: string; batchId: string };
export type UnenrolParams = EnrolParams;

// ─── useBatchListForCreator ─────────────────────────────────────────────────────
/**
 * Creator view: fetch only batches created by the current user
 * Returns `Batch[]`.
 */
export function useBatchListForCreator(
  courseId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<Batch[], Error> {
  const enabled = options?.enabled ?? true;
  const { data: authInfo } = useAuthInfo();
  const userId = authInfo?.uid ?? null;

  return useQuery({
    queryKey: ['batchList', courseId, true, userId],
    queryFn: async () => {
      if (!courseId || !userId) return [] as Batch[];
      
      const response = await creatorBatchService.listBatches(courseId, userId);
      return (response?.data?.response?.content ?? []) as Batch[];
    },
    enabled: enabled && !!courseId && !!userId,
    staleTime: 0,
    retry: 1,
  });
}

// ─── useBatchListForMentor ─────────────────────────────────────────────────────
/**
 * Mentor view: fetch only batches where the current user is a mentor
 * Returns `Batch[]`.
 */
export function useBatchListForMentor(
  courseId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<Batch[], Error> {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['batchList', courseId, 'mentor'],
    queryFn: async () => {
      if (!courseId) return [] as Batch[];

      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid;
      }
      if (!userId) return [] as Batch[];
      const response = await creatorBatchService.listBatches(courseId, undefined, [userId]);
      return (response?.data?.response?.content ?? []) as Batch[];
    },
    enabled: enabled && !!courseId,
    staleTime: 0,
    retry: 1,
  });
}


// ─── Utility ─────────────────────────────────────────────────────────────────
export function mergeBatches(batchesA?: Batch[], batchesB?: Batch[]): Batch[] {
  const combined = [...(batchesA || []), ...(batchesB || [])];
  const uniqueIds = Array.from(new Set(combined.map(b => b.id)));
  return uniqueIds.map(id => combined.find(b => b.id === id)!);
}

// ─── useBatchListForLearner ──────────────────────────────────────────────────
/**
 * Learner view: fetch all batches for enrollment
 * Returns `ApiResponse<BatchListResponse>`.
 */
export function useBatchListForLearner(
  courseId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<BatchListResponse>, Error> {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['batchList', courseId, false],
    queryFn: async () => {
      if (!courseId) return ({ data: { response: { content: [], count: 0 } } } as unknown as ApiResponse<BatchListResponse>);

      return learnerBatchService.batchList(courseId);
    },
    enabled: enabled && !!courseId,
  });
}

// ─── useBatchRead ─────────────────────────────────────────────────────────────
export const useBatchRead = (
  batchId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<BatchReadResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['batchRead', batchId],
    queryFn: () => learnerBatchService.batchRead(batchId!),
    enabled: enabled && !!batchId,
  });
};

// ─── useContentState ──────────────────────────────────────────────────────────
export const useContentState = (
  request: ContentStateReadRequest | null,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<ContentStateReadResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  const contentIdsKey = request?.contentIds?.length ? request.contentIds.join(',') : '';
  const fieldsKey = request?.fields?.join(',') ?? '';
  return useQuery({
    queryKey: ['contentState', request?.userId, request?.courseId, request?.batchId, contentIdsKey, fieldsKey],
    queryFn: () => learnerBatchService.contentStateRead(request!),
    enabled: enabled && !!request && request.contentIds.length > 0,
  });
};

// ─── useEnrol ─────────────────────────────────────────────────────────────────
export const useEnrol = (): UseMutationResult<ApiResponse<unknown>, Error, EnrolParams> => {
  return useMutation({
    mutationFn: ({ courseId, userId, batchId }: EnrolParams) =>
      learnerBatchService.enrol(courseId, userId, batchId),
  });
};

// ─── useUnenrol ───────────────────────────────────────────────────────────────
export const useUnenrol = (): UseMutationResult<ApiResponse<unknown>, Error, UnenrolParams> => {
  return useMutation({
    mutationFn: ({ courseId, userId, batchId }: UnenrolParams) =>
      learnerBatchService.unenrol(courseId, userId, batchId),
  });
};

// ─── useContentStateUpdateMutation ────────────────────────────────────────────
export const useContentStateUpdateMutation = (): UseMutationResult<
  ApiResponse<unknown>,
  Error,
  ContentStateUpdateRequest
> => {
  return useMutation({
    mutationFn: (request: ContentStateUpdateRequest) =>
      learnerBatchService.contentStateUpdate(request),
  });
};

// ─── Creator-side form interfaces ────────────────────────────────────────────
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


// ─── useCreateBatch ───────────────────────────────────────────────────────────
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

      const reqHeaders: Record<string, string> = { 'X-User-ID': userId };
      if (rootOrgId) reqHeaders['X-Channel-Id'] = rootOrgId;

      return creatorBatchService.createBatch(request, reqHeaders);
    },

    onSuccess: (response, variables) => {
      // Optimistically update the cache to reflect instantly
      queryClient.setQueryData<Batch[]>(['batchList', variables.courseId, true], (old) => {
        if (!old) return old;
        const newBatch: Batch = {
          id: response.data?.batchId || Math.random().toString(),
          courseId: variables.courseId,
          name: variables.name,
          description: variables.description,
          status: "0", // Upcoming by default
          startDate: variables.startDate,
          endDate: variables.endDate,
          enrollmentEndDate: variables.enrollmentEndDate,
          issueCertificate: variables.issueCertificate,
          mentors: variables.mentors,
        };
        return [newBatch, ...old];
      });

      // Invalidate after a delay to let the backend Elasticsearch index the update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['batchList', variables.courseId, true] });
      }, 2000);
    },
  });
};

// ─── useUpdateBatch ───────────────────────────────────────────────────────────
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

      const reqHeaders: Record<string, string> = { 'X-User-ID': userId };
      if (rootOrgId) {
        reqHeaders['X-Channel-Id'] = rootOrgId;
        reqHeaders['X-Org-code'] = rootOrgId;
      }

      return creatorBatchService.updateBatch(request, reqHeaders);
    },

    onSuccess: (_data, variables) => {
      // Optimistically update the cache
      queryClient.setQueryData<Batch[]>(['batchList', variables.courseId, true], (old) => {
        if (!old) return old;
        return old.map(b => b.id === variables.batchId ? { ...b, ...variables } : b);
      });

      // Invalidate after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['batchList', variables.courseId, true] });
      }, 2000);
    },
  });
};
