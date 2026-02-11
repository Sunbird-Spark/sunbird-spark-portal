export interface WorkspaceItem {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'content' | 'quiz' | 'collection';
  status: 'draft' | 'review' | 'published';
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  author: string;
}

export interface ContentSearchRequest {
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  query?: string;
  sort_by?: Record<string, string>;
}

export interface ContentSearchItem {
  identifier: string;
  name?: string;
  description?: string;
  objectType?: string;
  status?: string;
  posterImage?: string;
  thumbnail?: string;
  createdOn?: string;
  lastUpdatedOn?: string;
  creator?: string;
  createdBy?: string;
}

export interface ContentSearchResponse {
  content?: ContentSearchItem[];
  QuestionSet?: ContentSearchItem[];
}

export interface UseContentSearchOptions {
  request?: ContentSearchRequest;
  enabled?: boolean;
}
