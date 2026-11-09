import { useMemo } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { ContentService } from '@/services/ContentService';
import { ENRICHMENT_TYPES } from '@/services/enrichment/registry';
import { availabilityLimit, groupAvailableTypes } from '@/services/enrichment/availability';

const contentService = new ContentService();
const NONE: Record<string, string[]> = {};

/** Ids per search. A chunk keeps its query key while the list grows, so loading another page only searches the new ids. */
export const AVAILABILITY_CHUNK_SIZE = 20;

type SearchResponse = Awaited<ReturnType<ContentService['contentSearch']>>;

const mergeAvailability = (results: UseQueryResult<Record<string, string[]>>[]): Record<string, string[]> =>
  Object.assign({}, ...results.map((result) => result.data ?? NONE));

/**
 * Which of `contentIds` have Live enrichment objects, and of which types: `{ contentId: ['Transcript'] }`.
 * One search per chunk of ids (not per card), so each infinite-scroll page costs one new search instead of
 * re-searching everything loaded so far. Optional - a failing search just leaves those cards without badges.
 */
export const useEnrichmentAvailability = (contentIds: readonly string[], enabled: boolean): Record<string, string[]> => {
  const chunks = useMemo(() => {
    const out: string[][] = [];
    for (let i = 0; i < contentIds.length; i += AVAILABILITY_CHUNK_SIZE) {
      out.push(contentIds.slice(i, i + AVAILABILITY_CHUNK_SIZE).sort((a, b) => a.localeCompare(b)));
    }
    return out;
  }, [contentIds]);

  const merged = useQueries({
    queries: chunks.map((ids) => ({
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
      select: (res: SearchResponse) => groupAvailableTypes(res.data),
      enabled,
      staleTime: 60 * 1000,
      retry: false,
    })),
    combine: mergeAvailability,
  });
  return enabled ? merged : NONE;
};
