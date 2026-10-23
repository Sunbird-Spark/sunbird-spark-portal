import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ContentService } from '@/services/ContentService';
import { ENRICHMENT_TYPES } from '@/services/enrichment/registry';
import { availabilityLimit, groupAvailableTypes } from '@/services/enrichment/availability';

const contentService = new ContentService();
const NONE: Record<string, string[]> = {};

/**
 * Which of `contentIds` have Live enrichment objects, and of which types: `{ contentId: ['Transcript'] }`.
 * One search for the whole set (not per card). Optional - a failing search just leaves the cards without badges.
 */
export const useEnrichmentAvailability = (contentIds: readonly string[], enabled: boolean): Record<string, string[]> => {
  const ids = [...contentIds].sort((a, b) => a.localeCompare(b));
  const { data } = useQuery({
    queryKey: ['enrichment-availability', ids],
    queryFn: () =>
      contentService.contentSearch({
        filters: {
          objectType: 'EnrichmentObject',
          enrichmentObjectType: [...ENRICHMENT_TYPES],
          status: 'Live',
          parentId: ids,
        },
        limit: availabilityLimit(ids.length),
        fields: ['parentId', 'enrichmentObjectType'],
      }),
    select: (res) => groupAvailableTypes(res.data),
    enabled: enabled && ids.length > 0,
    // The previous page's badges stay put while the next set (after infinite scroll) loads.
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    retry: false,
  });
  return enabled && data ? data : NONE;
};
