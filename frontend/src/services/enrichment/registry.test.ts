import { describe, it, expect } from 'vitest';
import {
  ENRICHMENT_REGISTRY,
  applyEnrichments,
  enrichmentSearchFilter,
  enrichmentTypesForMime,
  knownEnrichmentTypes,
} from './registry';
import { transcriptDefinition } from './transcript';
import type { ContentData } from '@/types/contentTypes';
import type { EnrichmentObject, EnrichmentStatus } from '@/types/enrichmentTypes';

const content = { identifier: 'do_1', mimeType: 'video/mp4' } as unknown as ContentData;

const transcript = (over: Partial<EnrichmentObject> & Record<string, unknown> = {}): EnrichmentObject => ({
  identifier: 't1',
  enrichmentObjectType: 'Transcript',
  parentId: 'do_1',
  status: 'Live',
  language: 'English',
  languageCode: 'en',
  sourceLanguage: true,
  artifactUrl: 'https://blob/en/transcript.json',
  captionsUrl: 'https://blob/en/captions.vtt',
  ...over,
});

describe('enrichmentTypesForMime', () => {
  it.each(['video/mp4', 'video/webm'])('returns Transcript for %s', (mime) => {
    expect(enrichmentTypesForMime(mime)).toEqual(['Transcript']);
  });

  it.each(['application/pdf', 'video/x-youtube', '', undefined])('returns no types for %s (negative)', (mime) => {
    expect(enrichmentTypesForMime(mime)).toEqual([]);
  });
});

describe('transcript definition', () => {
  it('is the registered entry for Transcript, with its workspace filter label key', () => {
    expect(ENRICHMENT_REGISTRY).toContain(transcriptDefinition);
    expect(transcriptDefinition.type).toBe('Transcript');
    expect(transcriptDefinition.filterLabelKey).toBe('workspace.enrichmentFilters.Transcript');
  });
});

describe('applyEnrichments (Transcript)', () => {
  it('maps a Live transcript to the player shape, using the VTT for artifactUrl and wordByWordUrl', () => {
    const result = applyEnrichments(content, [transcript()]);
    expect(result.transcripts).toEqual([
      {
        language: 'English',
        identifier: 't1',
        languageCode: 'en',
        artifactUrl: 'https://blob/en/captions.vtt',
        wordByWordUrl: 'https://blob/en/captions.vtt',
        sourceLanguage: true,
      },
    ]);
    expect(result).not.toBe(content);
    expect(result.identifier).toBe('do_1');
  });

  it('falls back to the upper-cased languageCode, then UNKNOWN, when language is missing', () => {
    const [a, b] = applyEnrichments(content, [
      transcript({ identifier: 'a', language: undefined, languageCode: 'hi' }),
      transcript({ identifier: 'b', language: undefined, languageCode: undefined }),
    ]).transcripts!;
    expect(a!.language).toBe('HI');
    expect(b!.language).toBe('UNKNOWN');
    expect(b!.languageCode).toBe('');
  });

  it.each<EnrichmentStatus>(['Draft', 'Processing', 'Review', 'Failed', 'Retired'])('excludes a %s transcript (negative)', (status) => {
    const result = applyEnrichments(content, [transcript({ status })]);
    expect(result.transcripts).toBeUndefined();
  });

  it('excludes a transcript with no status - a missing status is never live (negative)', () => {
    const result = applyEnrichments(content, [transcript({ status: undefined as unknown as EnrichmentStatus })]);
    expect(result.transcripts).toBeUndefined();
  });

  it('excludes a Live transcript without a captionsUrl (negative)', () => {
    const result = applyEnrichments(content, [transcript({ captionsUrl: undefined })]);
    expect(result.transcripts).toBeUndefined();
  });

  it('keeps only the Live ones from a mixed list', () => {
    const result = applyEnrichments(content, [
      transcript({ identifier: 'live', languageCode: 'en' }),
      transcript({ identifier: 'draft', status: 'Draft', languageCode: 'hi' }),
      transcript({ identifier: 'failed', status: 'Failed', languageCode: 'ta' }),
    ]);
    expect(result.transcripts!.map((t) => t.identifier)).toEqual(['live']);
  });

  it('returns the same content reference when nothing maps (negative)', () => {
    expect(applyEnrichments(content, [])).toBe(content);
    expect(applyEnrichments(content, [transcript({ status: 'Draft' })])).toBe(content);
  });

  it('ignores objects of other enrichment types (negative)', () => {
    const other = transcript({ enrichmentObjectType: 'Summary' });
    expect(applyEnrichments(content, [other])).toBe(content);
  });
});

describe('knownEnrichmentTypes', () => {
  it('keeps registered types and drops unknown values, preserving order', () => {
    expect(knownEnrichmentTypes(['Bogus', 'Transcript', 'Other'])).toEqual(['Transcript']);
  });

  it('returns [] for an empty list (negative)', () => {
    expect(knownEnrichmentTypes([])).toEqual([]);
  });
});

describe('enrichmentSearchFilter', () => {
  it('returns the enrichmentTypes filters fragment for selected types', () => {
    expect(enrichmentSearchFilter(['Transcript'])).toEqual({ enrichmentTypes: ['Transcript'] });
  });

  it('returns an empty fragment when nothing is selected (negative)', () => {
    expect(enrichmentSearchFilter([])).toEqual({});
  });
});
