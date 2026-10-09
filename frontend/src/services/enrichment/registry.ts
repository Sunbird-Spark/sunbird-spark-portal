/** Enrichment registry - one entry per backend `enrichmentObjectType`; everything outside these entries is type-agnostic. */
import type { ContentData } from '@/types/contentTypes';
import type { EnrichmentObject } from '@/types/enrichmentTypes';
import { transcriptDefinition } from './transcript';

export interface EnrichmentDefinition {
  /** Matches `enrichmentObjectType` on the backend and the value stored in `Content.enrichmentTypes`. */
  type: string;
  /** Content mimeTypes this enrichment applies to. */
  mimeTypes: readonly string[];
  /** i18n key for the workspace filter button. */
  filterLabelKey: string;
  /** Returns the content with this type's objects applied for the player. */
  applyToContent: (content: ContentData, objects: EnrichmentObject[]) => ContentData;
}

export const ENRICHMENT_REGISTRY: readonly EnrichmentDefinition[] = [transcriptDefinition];

/** Types that apply to a content mimeType. */
export const enrichmentTypesForMime = (mimeType?: string): string[] =>
  mimeType ? ENRICHMENT_REGISTRY.filter((d) => d.mimeTypes.includes(mimeType)).map((d) => d.type) : [];

/** Folds every registered type's objects onto the content; returns the same reference when nothing applies. */
export const applyEnrichments = (content: ContentData, objects: EnrichmentObject[]): ContentData =>
  ENRICHMENT_REGISTRY.reduce(
    (acc, d) => d.applyToContent(acc, objects.filter((o) => o.enrichmentObjectType === d.type)),
    content,
  );

/** Keeps only values that are registered enrichment types (used to sanitise the workspace filter URL param). */
export const knownEnrichmentTypes = (values: readonly string[]): string[] =>
  values.filter((value) => ENRICHMENT_REGISTRY.some((d) => d.type === value));

/** The search `filters` fragment that restricts content to those that requested any of `types` (empty when none selected). */
export const enrichmentSearchFilter = (types: readonly string[]): Record<string, string[]> =>
  types.length ? { enrichmentTypes: [...types] } : {};
