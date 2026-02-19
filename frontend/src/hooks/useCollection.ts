import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { collectionService, mapToCollectionData } from '../services/collection';
import type {
  CollectionData,
  BatchListResponse,
  BatchReadResponse,
  ContentStateReadRequest,
  ContentStateReadResponse,
} from '../types/collectionTypes';
import type { ApiResponse } from '../lib/http-client';

export const useCollection = (
  collectionId: string | undefined
): UseQueryResult<CollectionData | null, Error> => {
  return useQuery({
    queryKey: ['collection-hierarchy', collectionId],
    queryFn: async (): Promise<CollectionData | null> => {
      if (!collectionId) return null;
      const response = await collectionService.getHierarchy(collectionId);
      const content = response?.data?.content;
      if (!content) return null;
      return mapToCollectionData(content);
    },
    enabled: !!collectionId,
  });
};

export const useBatchList = (
  courseId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<BatchListResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['batchList', courseId],
    queryFn: () => collectionService.batchList(courseId!),
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
    queryFn: () => collectionService.batchRead(batchId!),
    enabled: enabled && !!batchId,
  });
};

export const useContentState = (
  request: ContentStateReadRequest | null,
  options?: { enabled?: boolean }
): UseQueryResult<ApiResponse<ContentStateReadResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['contentState', request?.userId, request?.courseId, request?.batchId],
    queryFn: () => collectionService.contentStateRead(request!),
    enabled: enabled && !!request && request.contentIds.length > 0,
  });
};
