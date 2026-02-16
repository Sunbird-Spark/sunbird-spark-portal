import { getClient, ApiResponse } from '../lib/http-client';
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
}

export const searchContent = async (
    limit: number = 20,
    offset: number = 0,
    query: string = '',
    sort_by: any = { lastUpdatedOn: 'desc' },
    filters: any = {},
): Promise<any> => {
    const request = {
        filters,
        limit,
        offset,
        query,
        sort_by,
    };
    // The backend route is mounted at /api/content/v1 via app.use('/api', ...) and app.use(..., contentRoutes)
    const response = await getClient().post<any>('/api/content/v1/search', { request });
    // Unwrap the response to match what ExploreGrid expects
    // If backend returns { result: { content: [...] } }, we return result.
    return response.data?.result || response.data;
};
