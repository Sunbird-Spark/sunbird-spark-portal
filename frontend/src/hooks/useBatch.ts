import { useMutation, useQuery, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { batchService } from '../services/collection';
import type {
  BatchListResponse,
  BatchReadResponse,
  ContentStateReadRequest,
  ContentStateReadResponse,
} from '../types/collectionTypes';
import type { ApiResponse } from '../lib/http-client';

export type EnrolParams = { courseId: string; userId: string; batchId: string };

export const useBatchList = (
  courseId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<BatchListResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['batchList', courseId],
    queryFn: () => batchService.batchList(courseId!),
    enabled: enabled && !!courseId,
  });
};

export const useBatchRead = (
  batchId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<BatchReadResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['batchRead', batchId],
    queryFn: () => batchService.batchRead(batchId!),
    enabled: enabled && !!batchId,
  });
};

export const useContentState = (
  request: ContentStateReadRequest | null,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<ContentStateReadResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  const contentIdsKey = request?.contentIds?.length
    ? request.contentIds.join(',')
    : '';
  return useQuery({
    queryKey: ['contentState', request?.userId, request?.courseId, request?.batchId, contentIdsKey],
    queryFn: () => batchService.contentStateRead(request!),
    enabled: enabled && !!request && request.contentIds.length > 0,
  });
};

export const useEnrol = (): UseMutationResult<
  ApiResponse<unknown>,
  Error,
  EnrolParams
> => {
  return useMutation({
    mutationFn: ({ courseId, userId, batchId }: EnrolParams) =>
      batchService.enrol(courseId, userId, batchId),
  });
};
