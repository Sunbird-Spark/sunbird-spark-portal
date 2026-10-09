import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useContentRead } from '@/hooks/useContent';
import { enrichmentObjectService } from '@/services/EnrichmentObjectService';
import { applyEnrichments, enrichmentTypesForMime } from '@/services/enrichment/registry';
import type { ContentData } from '@/types/contentTypes';

/**
 * Content read plus the content's enrichment objects (transcripts, ...), merged into ONE object.
 * VideoPlayer rebuilds when the `metadata` object identity changes, which restarts playback, so
 * the player must not see the content first and the enriched content later: `isLoading` stays
 * true until both calls settle, and `content` keeps a stable identity until its inputs change.
 * Enrichments are optional - a failing list call yields the plain content, never a page error.
 */
export const useContentWithEnrichments = (
  contentId: string,
  options?: { enabled?: boolean; fields?: string[]; mode?: string }
): { content: ContentData | undefined; isLoading: boolean; error: Error | null } => {
  const read = useContentRead(contentId, options);
  const content = read.data?.data?.content;
  const types = useMemo(() => enrichmentTypesForMime(content?.mimeType), [content?.mimeType]);

  const enrich = useQuery({
    queryKey: ['enrichment-objects', contentId, types],
    queryFn: () => enrichmentObjectService.listForTypes(contentId, types),
    enabled: !!content && types.length > 0,
    // Objects appear after publish; an hour-old empty list (the content read's staleTime) would hide them.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const merged = useMemo(
    () => (content && enrich.data ? applyEnrichments(content, enrich.data) : content),
    [content, enrich.data],
  );

  return { content: merged, isLoading: read.isLoading || enrich.isLoading, error: read.error };
};
