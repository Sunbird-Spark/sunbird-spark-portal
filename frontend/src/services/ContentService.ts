import { getClient, ApiResponse } from '../lib/http-client';
import { ContentData, ContentApiResponse } from "@/types/contentTypes";
import type { ContentSearchRequest, ContentSearchResponse } from '../types/workspaceTypes';

export class ContentService {
  public async contentSearch(
    request: ContentSearchRequest = {}
  ): Promise<ApiResponse<ContentSearchResponse>> {
    return getClient().post<ContentSearchResponse>('/composite/v1/search', {
      request: {
        filters: request.filters ?? {},
        limit: request.limit ?? 20,
        offset: request.offset ?? 0,
        query: request.query ?? '',
        sort_by: request.sort_by ?? { lastUpdatedOn: 'desc' },
      },
    });
  }

  public async contentRead(contentId: string): Promise<ApiResponse<ContentApiResponse>> {
    return getClient().get<ContentApiResponse>(`/content/v1/read/${contentId}`);
  }
}

