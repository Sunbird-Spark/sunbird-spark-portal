import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ContentService } from '../services/ContentService';
import { ApiResponse } from '../lib/http-client';
import { ContentApiResponse } from '../types/contentTypes';
import type { ContentSearchResponse, UseContentSearchOptions } from '../types/workspaceTypes';

const contentService = new ContentService();

// Fallback list used when no primaryCategory filter is selected by the user.
// Ensures the search returns all known content categories by default.
const DEFAULT_PRIMARY_CATEGORIES = [
  'Collection',
  'Resource',
  'Content Playlist',
  'Course',
  'Course Assessment',
  'Digital Textbook',
  'eTextbook',
  'Explanation Content',
  'Learning Resource',
  'Lesson Plan Unit',
  'Practice Question Set',
  'Teacher Resource',
  'Textbook Unit',
  'LessonPlan',
  'FocusSpot',
  'Learning Outcome Definition',
  'Curiosity Questions',
  'MarkingSchemeRubric',
  'ExplanationResource',
  'ExperientialResource',
  'Practice Resource',
  'TVLesson',
  'Course Unit',
  'Exam Question',
  'Question paper',
];

export const useContentSearch = (
  options?: UseContentSearchOptions
): UseQueryResult<ApiResponse<ContentSearchResponse>, Error> => {
  const request = options?.request;
  const enabled = options?.enabled ?? true;

  // Inject the primaryCategory fallback when the user hasn't selected any category filter.
  const effectiveRequest = useMemo(() => {
    if (!request) return request;
    const hasPrimaryCategory = Array.isArray(request.filters?.primaryCategory)
      ? request.filters.primaryCategory.length > 0
      : !!request.filters?.primaryCategory;
    if (hasPrimaryCategory) return request;
    return {
      ...request,
      filters: {
        ...request.filters,
        primaryCategory: DEFAULT_PRIMARY_CATEGORIES,
      },
    };
  }, [request]);

  // Build a stable queryKey from individual fields so property order never affects caching
  const queryKey = useMemo(() => [
    'content-search',
    effectiveRequest?.query,
    effectiveRequest?.offset,
    effectiveRequest?.limit,
    JSON.stringify(effectiveRequest?.sort_by),
    JSON.stringify(effectiveRequest?.filters),
  ], [effectiveRequest]);

  return useQuery({
    queryKey,
    queryFn: () => contentService.contentSearch(effectiveRequest),
    enabled,
  });
};

export const useContentRead = (
  contentId: string,
  options?: { enabled?: boolean; fields?: string[] }
): UseQueryResult<ApiResponse<ContentApiResponse>, Error> => {
  const enabled = options?.enabled ?? true;
  const fields = options?.fields;
  return useQuery({
    queryKey: ['content-read', contentId, fields],
    queryFn: () => contentService.contentRead(contentId, fields),
    enabled: enabled && !!contentId,
  });
};
