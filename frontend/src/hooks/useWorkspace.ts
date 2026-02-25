import { useMemo, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ContentService } from '@/services/ContentService';
import { mapContentToWorkspaceItem } from '@/services/workspace';
import type {
  WorkspaceView,
  SortOption,
  ContentTypeFilter,
  WorkspaceCounts,
  WorkspaceItem,
  UseWorkspaceReturn,
  ContentSearchResponse,
} from '@/types/workspaceTypes';
import type { ApiResponse } from '@/lib/http-client';
import {
  WORKSPACE_STATUS_FILTER,
  WORKSPACE_PRIMARY_CATEGORY_FILTER,
  WORKSPACE_PAGE_LIMIT,
  getStatusFilterForTab,
  getPrimaryCategoryForTypeFilter,
} from '@/pages/workspace/workspaceConstants';

const contentService = new ContentService();

/** Derive the `sort_by` object from a UI sort option. */
function buildSortBy(sortBy: SortOption): Record<string, string> {
  switch (sortBy) {
    case 'updated':
      return { lastUpdatedOn: 'desc' };
    case 'created':
      return { createdOn: 'desc' };
    case 'title':
      return { name: 'asc' };
    default:
      return { lastUpdatedOn: 'desc' };
  }
}

interface UseWorkspaceOptions {
  userId: string | null;
  activeTab: WorkspaceView;
  sortBy: SortOption;
  typeFilter: ContentTypeFilter;
  userRole?: 'creator' | 'reviewer';
  /** Organisation channel ID — used to scope reviewer content to the same org. */
  orgId?: string;
  enabled?: boolean;
}

/**
 * Custom hook that provides workspace content with server-side filtering,
 * facet-driven tab counts, and infinite-scroll pagination.
 *
 * Two separate queries:
 * 1. **Counts query** — fetches facet counts across all statuses (limit=1).
 *    In reviewer mode, uses `createdBy != userId` to exclude the reviewer's
 *    own content directly at the API level.
 * 2. **Content query** — `useInfiniteQuery` that fetches pages of 20 items
 *    filtered by the active tab's status values.
 */
export function useWorkspace({
  userId,
  activeTab,
  sortBy,
  typeFilter,
  userRole = 'creator',
  orgId,
  enabled = true,
}: UseWorkspaceOptions): UseWorkspaceReturn {
  const queryClient = useQueryClient();
  const isContentTab = !['create', 'uploads', 'collaborations'].includes(activeTab);
  const queryEnabled = enabled && !!userId && isContentTab;

  // Whether the user is operating in reviewer mode (affects counts & content filters).
  const isReviewerMode = userRole === 'reviewer';

  // Whether this specific tab shows the current user's own content.
  // Reviewer tabs (pending-review, my-published) show other people's content.
  const isReviewerTab = isReviewerMode && ['pending-review', 'my-published'].includes(activeTab);

  // ── Counts query (runs once per role, shared across tabs) ──────────────
  // Both modes use facets (limit=1) for lightweight counting.
  // Creator mode: scoped to the user's own content.
  // Reviewer mode: uses createdBy != to exclude the reviewer's own content directly.
  const countsQuery = useQuery({
    queryKey: ['workspace-counts', userId, userRole, orgId],
    queryFn: () =>
      contentService.contentSearch({
        filters: {
          createdBy: isReviewerMode ? { '!=': userId ?? '' } : (userId ?? ''),
          ...(isReviewerMode && orgId ? { createdFor: [orgId] } : {}),
          status: [...WORKSPACE_STATUS_FILTER],
          primaryCategory: [...WORKSPACE_PRIMARY_CATEGORY_FILTER],
        },
        facets: ['status'],
        limit: 1,
        offset: 0,
      }),
    enabled: queryEnabled,
    staleTime: 0,
  });

  const counts: WorkspaceCounts = useMemo(() => {
    const facets = countsQuery.data?.data?.facets;
    const statusFacet = facets?.find((f) => f.name === 'status');
    const getFacetCount = (name: string) =>
      statusFacet?.values.find((v) => v.name === name)?.count ?? 0;

    const drafts = isReviewerMode ? 0 : getFacetCount('draft') + getFacetCount('flagdraft');
    const review = getFacetCount('review') + getFacetCount('processing') + getFacetCount('flagreview');
    const published = getFacetCount('live') + getFacetCount('unlisted');
    const all = isReviewerMode ? review + published : (countsQuery.data?.data?.count ?? 0);

    return { all, drafts, review, published, pendingReview: review };
  }, [countsQuery.data, isReviewerMode]);

  // ── Content query (per tab, paginated) ────────────────────────────────
  const statusFilter = getStatusFilterForTab(activeTab);
  const primaryCategoryFilter =
    getPrimaryCategoryForTypeFilter(typeFilter) ?? [...WORKSPACE_PRIMARY_CATEGORY_FILTER];

  const contentQuery = useInfiniteQuery<ApiResponse<ContentSearchResponse>, Error>({
    queryKey: ['workspace-content', userId, activeTab, sortBy, typeFilter, userRole, orgId],
    queryFn: ({ pageParam }) =>
      contentService.contentSearch({
        filters: {
          createdBy: isReviewerTab ? { '!=': userId ?? '' } : (userId ?? ''),
          ...(isReviewerTab && orgId ? { createdFor: [orgId] } : {}),
          status: statusFilter,
          primaryCategory: primaryCategoryFilter,
        },
        limit: WORKSPACE_PAGE_LIMIT,
        offset: pageParam as number,
        sort_by: buildSortBy(sortBy),
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.length * WORKSPACE_PAGE_LIMIT;
      const total = lastPage.data?.count ?? 0;
      return totalLoaded < total ? totalLoaded : undefined;
    },
    enabled: queryEnabled,
  });

  // Flatten all pages into a single items array
  const contents: WorkspaceItem[] = useMemo(() => {
    if (!contentQuery.data?.pages) return [];
    return contentQuery.data.pages.flatMap((page) => {
      const content = page.data?.content ?? [];
      const questionSets = page.data?.QuestionSet ?? [];
      return [...content, ...questionSets].map(mapContentToWorkspaceItem);
    });
  }, [contentQuery.data]);

  const totalCount = contentQuery.data?.pages[0]?.data?.count ?? 0;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = contentQuery;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refetchCounts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['workspace-counts', userId] });
    await queryClient.refetchQueries({ queryKey: ['workspace-counts', userId], type: 'active' });
  }, [queryClient, userId]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workspace-counts', userId] }),
      queryClient.invalidateQueries({ queryKey: ['workspace-content', userId] }),
    ]);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['workspace-counts', userId], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['workspace-content', userId], type: 'active' }),
    ]);
  }, [queryClient, userId]);

  return {
    contents,
    counts,
    totalCount,
    isLoading: contentQuery.isLoading,
    isLoadingMore: isFetchingNextPage,
    isCountsLoading: countsQuery.isLoading,
    isRefreshing: contentQuery.isRefetching && !contentQuery.isLoading && !isFetchingNextPage,
    error: contentQuery.error,
    hasMore: !!hasNextPage,
    loadMore,
    refetchCounts,
    refetchAll,
  };
}
