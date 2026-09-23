import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { collectionService, mapToCollectionData } from '../services/collection';
import type { CollectionData } from '../types/collectionTypes';

/**
 * Query options for a collection hierarchy, shared so that callers fetching many
 * hierarchies at once (`useQueries`) hit the exact same cache entries as the
 * single-collection `useCollection` — a path already opened is never refetched.
 */
export const collectionHierarchyQueryOptions = (collectionId: string | undefined) => ({
  queryKey: ['collection-hierarchy', collectionId],
  queryFn: async (): Promise<CollectionData | null> => {
    if (!collectionId) return null;
    const response = await collectionService.getHierarchy(collectionId);
    const content = response?.data?.content;
    if (!content) return null;
    return mapToCollectionData(content);
  },
  enabled: !!collectionId,
  staleTime: 60 * 60 * 1000,
});

export const useCollection = (
  collectionId: string | undefined
): UseQueryResult<CollectionData | null, Error> => {
  return useQuery(collectionHierarchyQueryOptions(collectionId));
};
