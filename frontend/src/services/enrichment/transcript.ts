import type { ContentData, PlayerTranscript } from '@/types/contentTypes';
import type { EnrichmentObject, TranscriptObject } from '@/types/enrichmentTypes';
import type { EnrichmentDefinition } from './registry';

/* artifactUrl for the player must be the VTT (captionsUrl), not transcript.json. wordByWordUrl is the
   same VTT for every language: the overlay's accumulation logic handles both word-level and
   sentence-level VTTs correctly on its own (a full cue is never truncated, only additional cues
   appended to a non-empty line are capped), so there is no need to know a language's granularity here. */
const toPlayerTranscript = (o: TranscriptObject & { captionsUrl: string }): PlayerTranscript => ({
  language: o.language || (o.languageCode || 'Unknown').toUpperCase(),
  identifier: o.identifier,
  languageCode: o.languageCode || '',
  artifactUrl: o.captionsUrl,
  wordByWordUrl: o.captionsUrl,
  sourceLanguage: !!o.sourceLanguage,
});

/** Requires an explicit 'Live' status - a missing or not-yet-approved status is never served as a live caption. */
function applyToContent(content: ContentData, objects: EnrichmentObject[]): ContentData {
  const transcripts = (objects as TranscriptObject[])
    .filter((o): o is TranscriptObject & { captionsUrl: string } => o.status === 'Live' && !!o.captionsUrl)
    .map(toPlayerTranscript);
  return transcripts.length ? { ...content, transcripts } : content;
}

export const transcriptDefinition: EnrichmentDefinition = {
  type: 'Transcript',
  mimeTypes: ['video/mp4', 'video/webm'],
  filterLabelKey: 'workspace.enrichmentFilters.Transcript',
  applyToContent,
};
