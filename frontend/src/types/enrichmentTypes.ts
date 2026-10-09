export type EnrichmentStatus = 'Draft' | 'Processing' | 'Review' | 'Live' | 'Failed' | 'Retired';

/** One EnrichmentObject attached to a content, as returned by POST /object/enrichment/v4/list. */
export interface EnrichmentObject {
  identifier: string;
  enrichmentObjectType: string;
  parentId: string;
  parentType?: string;
  status: EnrichmentStatus;
  channel?: string;
  generatedBy?: string;
  autoApproved?: boolean;
  errorMessage?: string;
  createdOn?: string;
  lastUpdatedOn?: string;
  /** Category-specific fields arrive through the category definition overlay. */
  [key: string]: unknown;
}

/** A single language's transcript. Language fields stay empty until generation detects them. */
export interface TranscriptObject extends EnrichmentObject {
  enrichmentObjectType: 'Transcript';
  language?: string;
  languageCode?: string;
  sourceLanguage?: boolean;
  /** transcript.json with the segments. */
  artifactUrl?: string;
  /** The VTT the player uses. */
  captionsUrl?: string;
}
