import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ContentService } from '../services/ContentService';
import { ApiResponse } from '../lib/http-client';
import { ContentApiResponse } from '../types/contentTypes';
import type { ContentSearchResponse, UseContentSearchOptions } from '../types/workspaceTypes';

const contentService = new ContentService();

export const useContentSearch = (
  options?: UseContentSearchOptions
): UseQueryResult<ApiResponse<ContentSearchResponse>, Error> => {
  const request = options?.request;
  const enabled = options?.enabled ?? true;
  
  // Serialize the request to create a stable queryKey
  const queryKey = useMemo(() => 
    ['content-search', JSON.stringify(request)],
    [request]
  );
  
  return useQuery({
    queryKey,
    queryFn: () => contentService.contentSearch(request),
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
