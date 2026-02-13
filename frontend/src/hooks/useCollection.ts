import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { CollectionService, mapToCollectionData } from '../services/collection';
import type { CollectionData } from '../data/collectionData';

const collectionService = new CollectionService();

export function useCollection(
  collectionId: string | undefined
): UseQueryResult<CollectionData | null, Error> {
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
}
