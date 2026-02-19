import type React from 'react';
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
  headerStyle?: React.CSSProperties;
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
  primaryCategory: string;
  contentType: string;
}

export interface FacetValue {
  name: string;
  count: number;
}

export interface Facet {
  name: string;
  values: FacetValue[];
}

export interface ContentSearchRequest {
  filters?: Record<string, unknown>;
  facets?: string[];
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
  contentType?: string;
}

export interface ContentSearchResponse {
  count?: number;
  content?: ContentSearchItem[];
  QuestionSet?: ContentSearchItem[];
  facets?: Facet[];
}

export interface UseContentSearchOptions {
  request?: ContentSearchRequest;
  enabled?: boolean;
}

/** Aggregated counts for workspace tabs, derived from API facets. */
export interface WorkspaceCounts {
  all: number;
  drafts: number;
  review: number;
  published: number;
  pendingReview: number;
}

/** Return type of the useWorkspace hook. */
export interface UseWorkspaceReturn {
  /** Content items for the current tab/page (flattened across all loaded pages). */
  contents: WorkspaceItem[];
  /** Tab badge counts derived from facets. */
  counts: WorkspaceCounts;
  /** Total matching items for the current tab filter. */
  totalCount: number;
  /** True during the initial load of the content query. */
  isLoading: boolean;
  /** True while fetching the next page (Load More). */
  isLoadingMore: boolean;
  /** True during the initial load of the counts query. */
  isCountsLoading: boolean;
  /** True when content is being background-refetched (e.g. after delete/review). */
  isRefreshing: boolean;
  /** Error from the content query, if any. */
  error: Error | null;
  /** Whether more pages are available to load. */
  hasMore: boolean;
  /** Trigger to load the next page of results. */
  loadMore: () => void;
  /** Refetch the counts query (e.g. after content creation). */
  refetchCounts: () => Promise<void>;
  /** Refetch both counts and content (e.g. after delete/review). */
  refetchAll: () => Promise<void>;
}
