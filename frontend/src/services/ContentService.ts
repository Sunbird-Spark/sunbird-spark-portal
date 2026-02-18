import { getClient, ApiResponse } from '../lib/http-client';
import { ContentApiResponse } from "@/types/contentTypes";
import type { ContentSearchRequest, ContentSearchResponse } from '../types/workspaceTypes';

const DEFAULT_CONTENT_FIELDS = [
  'transcripts', 'ageGroup', 'appIcon', 'artifactUrl', 'attributions', 'audience',
  'author', 'badgeAssertions', 'body', 'channel', 'code', 'concepts', 'contentCredits',
  'contentType', 'contributors', 'copyright', 'copyrightYear', 'createdBy', 'createdOn',
  'creator', 'creators', 'description', 'displayScore', 'domain', 'editorState',
  'flagReasons', 'flaggedBy', 'flags', 'framework', 'identifier', 'itemSetPreviewUrl',
  'keywords', 'language', 'languageCode', 'lastUpdatedOn', 'license', 'mediaType',
  'mimeType', 'name', 'originData', 'osId', 'owner', 'pkgVersion', 'publisher',
  'questions', 'resourceType', 'scoreDisplayConfig', 'status', 'streamingUrl',
  'template', 'templateId', 'totalQuestions', 'totalScore', 'versionKey', 'visibility',
  'year', 'primaryCategory', 'additionalCategories', 'interceptionPoints', 'interceptionType',
];

export class ContentService {
  public async contentSearch(
    request: ContentSearchRequest = {}
  ): Promise<ApiResponse<ContentSearchResponse>> {
    return getClient().post<ContentSearchResponse>('/composite/v1/search', {
      request: {
        filters: request.filters ?? {},
        facets: request.facets,
        limit: request.limit ?? 20,
        offset: request.offset ?? 0,
        query: request.query ?? '',
        sort_by: request.sort_by ?? { lastUpdatedOn: 'desc' },
      },
    });
  }

  public async contentRead(contentId: string, fields?: string[]): Promise<ApiResponse<ContentApiResponse>> {
    const resolvedFields = fields ?? DEFAULT_CONTENT_FIELDS;
    const queryString = resolvedFields.length ? `?fields=${resolvedFields.join(',')}` : '';
    return getClient().get<ContentApiResponse>(`/content/v1/read/${contentId}${queryString}`);
  }

  public async contentCreate(
    name: string,
    options: {
      createdBy: string;
      creator: string;
      mimeType?: string;
      contentType?: string;
      primaryCategory?: string;
      framework?: string;
    }
  ): Promise<ApiResponse<ContentCreateResponse>> {
    return getClient().post<ContentCreateResponse>('/content/v1/create', {
      request: {
        content: {
          name,
          code: crypto.randomUUID(),
          createdBy: options.createdBy,
          creator: options.creator,
          mimeType: options.mimeType ?? 'application/vnd.ekstep.ecml-archive',
          contentType: options.contentType ?? 'Resource',
          primaryCategory: options.primaryCategory ?? 'Learning Resource',
          ...(options.framework && { framework: options.framework }),
        },
      },
    });
  }
}

export interface ContentCreateResponse {
  content_id: string;
  identifier: string;
  node_id: string;
  versionKey: string;
}
