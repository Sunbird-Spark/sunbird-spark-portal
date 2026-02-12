import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { WorkspaceService } from '../services/workspace';
import { ApiResponse } from '../lib/http-client';
import type { ContentSearchResponse, UseContentSearchOptions } from '../types/workspaceTypes';

const workspaceService = new WorkspaceService();

export const useContentSearch = (
  options?: UseContentSearchOptions
): UseQueryResult<ApiResponse<ContentSearchResponse>, Error> => {
  const request = options?.request;
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['content-search', request],
    queryFn: () => workspaceService.compositeSearch(request),
    enabled,
  });
};
