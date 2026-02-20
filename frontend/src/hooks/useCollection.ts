import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { collectionService, mapToCollectionData } from '../services/collection';
import type { CollectionData } from '../types/collectionTypes';

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
