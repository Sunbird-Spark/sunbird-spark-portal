import type { IconType } from 'react-icons';

export type WorkspaceView =
  | 'create'
  | 'all'
  | 'drafts'
  | 'review'
  | 'published'
  | 'uploads'
  | 'collaborations'
  | 'pending-review'
  | 'my-published';

export type UserRole = 'creator' | 'reviewer';

export type ViewMode = 'grid' | 'list';

export type SortOption = 'updated' | 'created' | 'title';

export type ContentTypeFilter = 'all' | 'course' | 'content' | 'quiz' | 'collection';

export interface EditorOption {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  iconBg: string;
  iconColor: string;
}

export interface EditorCategory {
  id: string;
  title: string;
  subtitle: string;
  options: EditorOption[];
  accentColor: string;
  borderColor: string;
}

export interface WorkspaceSidebarCounts {
  drafts: number;
  review: number;
  published: number;
  all: number;
  pendingReview?: number;
}

export interface WorkspaceSegment {
  id: WorkspaceView;
  label: string;
  count?: number;
}

export interface WorkspaceSecondaryAction {
  id: WorkspaceView;
  label: string;
}

export type EmptyStateVariant = 'default' | 'uploads' | 'collaborations' | 'search';

export interface WorkspaceItem {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'content' | 'quiz' | 'collection';
  status: 'draft' | 'review' | 'published';
  thumbnail?: string;
  createdAt: string | null;
  updatedAt: string | null;
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
  mimeType?: string;
  appIcon?: string;
  primaryCategory?: string;
}

export interface ContentSearchResponse {
  content?: ContentSearchItem[];
  QuestionSet?: ContentSearchItem[];
}

export interface UseContentSearchOptions {
  request?: ContentSearchRequest;
  enabled?: boolean;
}
