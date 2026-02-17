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
  enabled?: boolean;
}

/**
 * Custom hook that provides workspace content with server-side filtering,
 * facet-driven tab counts, and infinite-scroll pagination.
 *
 * Two separate queries:
 * 1. **Counts query** — fetches facet counts across all statuses (limit=1).
 * 2. **Content query** — `useInfiniteQuery` that fetches pages of 20 items
 *    filtered by the active tab's status values.
 */
export function useWorkspace({
  userId,
  activeTab,
  sortBy,
  typeFilter,
  userRole = 'creator',
  enabled = true,
}: UseWorkspaceOptions): UseWorkspaceReturn {
  const queryClient = useQueryClient();
  const isContentTab = !['create', 'uploads', 'collaborations'].includes(activeTab);
  const queryEnabled = enabled && !!userId && isContentTab;

  // Whether this tab shows the current user's own content
  const isOwnContentTab = !['pending-review'].includes(activeTab) || userRole === 'creator';

  // ── Counts query (runs once, shared across tabs) ──────────────────────
  const countsQuery = useQuery({
    queryKey: ['workspace-counts', userId],
    queryFn: () =>
      contentService.contentSearch({
        filters: {
          ...(isOwnContentTab ? { createdBy: userId ?? '' } : {}),
          status: [...WORKSPACE_STATUS_FILTER],
          primaryCategory: [...WORKSPACE_PRIMARY_CATEGORY_FILTER],
        },
        facets: ['status'],
        limit: 1,
        offset: 0,
      }),
    enabled: queryEnabled,
    staleTime: 30_000, // counts are valid for 30 seconds
  });

  const counts: WorkspaceCounts = useMemo(() => {
    const facets = countsQuery.data?.data?.facets;
    const statusFacet = facets?.find((f) => f.name === 'status');
    const getFacetCount = (name: string) =>
      statusFacet?.values.find((v) => v.name === name)?.count ?? 0;

    const drafts = getFacetCount('draft') + getFacetCount('flagdraft');
    const review = getFacetCount('review') + getFacetCount('processing') + getFacetCount('flagreview');
    const published = getFacetCount('live') + getFacetCount('unlisted');
    const all = countsQuery.data?.data?.count ?? 0;

    return { all, drafts, review, published, pendingReview: review };
  }, [countsQuery.data]);

  // ── Content query (per tab, paginated) ────────────────────────────────
  const statusFilter = getStatusFilterForTab(activeTab);
  const primaryCategoryFilter =
    getPrimaryCategoryForTypeFilter(typeFilter) ?? [...WORKSPACE_PRIMARY_CATEGORY_FILTER];

  const contentQuery = useInfiniteQuery<ApiResponse<ContentSearchResponse>, Error>({
    queryKey: ['workspace-content', userId, activeTab, sortBy, typeFilter, userRole],
    queryFn: ({ pageParam }) =>
      contentService.contentSearch({
        filters: {
          ...(isOwnContentTab ? { createdBy: userId ?? '' } : {}),
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

  const refetchCounts = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['workspace-counts', userId] });
  }, [queryClient, userId]);

  const refetchAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['workspace-counts', userId] });
    void queryClient.invalidateQueries({ queryKey: ['workspace-content', userId] });
  }, [queryClient, userId]);

  return {
    contents,
    counts,
    totalCount,
    isLoading: contentQuery.isLoading,
    isLoadingMore: isFetchingNextPage,
    isCountsLoading: countsQuery.isLoading,
    error: contentQuery.error,
    hasMore: !!hasNextPage,
    loadMore,
    refetchCounts,
    refetchAll,
  };
}
