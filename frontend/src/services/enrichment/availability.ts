import type { ContentSearchResponse } from '@/types/workspaceTypes';

/** Max EnrichmentObjects one availability search may return: ids x (languages/variants per content), capped at the search window. */
export const availabilityLimit = (idCount: number): number => Math.min(idCount * 20, 10000);

/** Groups the Live EnrichmentObjects of a search response by parent content: `{ contentId: ['Transcript', ...] }`. */
export const groupAvailableTypes = (response: ContentSearchResponse | undefined): Record<string, string[]> => {
  const byParent: Record<string, string[]> = {};
  for (const { parentId, enrichmentObjectType } of response?.EnrichmentObject ?? []) {
    if (!parentId || !enrichmentObjectType) continue;
    const types = (byParent[parentId] ??= []);
    if (!types.includes(enrichmentObjectType)) types.push(enrichmentObjectType);
  }
  return byParent;
};
