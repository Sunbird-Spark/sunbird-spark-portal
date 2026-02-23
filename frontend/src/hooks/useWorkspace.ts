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
 *    In reviewer mode, fetches items (limit=WORKSPACE_PAGE_LIMIT) and counts
 *    client-side after filtering out the reviewer's own content.
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
  const isOwnContentTab = !isReviewerTab;

  // ── Counts query (runs once per role, shared across tabs) ──────────────
  // Both modes use facets (limit=1) for lightweight counting.
  // Creator mode: single query scoped to the user's own content.
  // Reviewer mode: org-wide facets minus the reviewer's own content facets.
  const countsQuery = useQuery({
    queryKey: ['workspace-counts', userId, userRole, orgId],
    queryFn: () =>
      contentService.contentSearch({
        filters: {
          ...(!isReviewerMode ? { createdBy: userId ?? '' } : {}),
          ...(isReviewerMode && orgId ? { createdFor: [orgId] } : {}),
          status: [...WORKSPACE_STATUS_FILTER],
          primaryCategory: [...WORKSPACE_PRIMARY_CATEGORY_FILTER],
        },
        facets: ['status'],
        limit: 1,
        offset: 0,
      }),
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  // Reviewer's own content facets — used to subtract from org-wide counts.
  const ownCountsQuery = useQuery({
    queryKey: ['workspace-own-counts', userId, orgId],
    queryFn: () =>
      contentService.contentSearch({
        filters: {
          createdBy: userId ?? '',
          ...(orgId ? { createdFor: [orgId] } : {}),
          status: [...WORKSPACE_STATUS_FILTER],
          primaryCategory: [...WORKSPACE_PRIMARY_CATEGORY_FILTER],
        },
        facets: ['status'],
        limit: 1,
        offset: 0,
      }),
    enabled: queryEnabled && isReviewerMode,
    staleTime: 30_000,
  });

  const counts: WorkspaceCounts = useMemo(() => {
    const facets = countsQuery.data?.data?.facets;
    const statusFacet = facets?.find((f) => f.name === 'status');
    const getFacetCount = (name: string) =>
      statusFacet?.values.find((v) => v.name === name)?.count ?? 0;

    if (isReviewerMode) {
      // Subtract the reviewer's own content counts from org-wide facets
      const ownFacets = ownCountsQuery.data?.data?.facets;
      const ownStatusFacet = ownFacets?.find((f) => f.name === 'status');
      const getOwnFacetCount = (name: string) =>
        ownStatusFacet?.values.find((v) => v.name === name)?.count ?? 0;

      const review = (getFacetCount('review') - getOwnFacetCount('review'))
        + (getFacetCount('processing') - getOwnFacetCount('processing'))
        + (getFacetCount('flagreview') - getOwnFacetCount('flagreview'));
      const published = (getFacetCount('live') - getOwnFacetCount('live'))
        + (getFacetCount('unlisted') - getOwnFacetCount('unlisted'));
      const all = review + published;

      return { all, drafts: 0, review, published, pendingReview: review };
    }

    // Creator mode: use facet counts directly
    const drafts = getFacetCount('draft') + getFacetCount('flagdraft');
    const review = getFacetCount('review') + getFacetCount('processing') + getFacetCount('flagreview');
    const published = getFacetCount('live') + getFacetCount('unlisted');
    const all = countsQuery.data?.data?.count ?? 0;

    return { all, drafts, review, published, pendingReview: review };
  }, [countsQuery.data, ownCountsQuery.data, isReviewerMode]);

  // ── Content query (per tab, paginated) ────────────────────────────────
  const statusFilter = getStatusFilterForTab(activeTab);
  const primaryCategoryFilter =
    getPrimaryCategoryForTypeFilter(typeFilter) ?? [...WORKSPACE_PRIMARY_CATEGORY_FILTER];

  const contentQuery = useInfiniteQuery<ApiResponse<ContentSearchResponse>, Error>({
    queryKey: ['workspace-content', userId, activeTab, sortBy, typeFilter, userRole, orgId],
    queryFn: ({ pageParam }) =>
      contentService.contentSearch({
        filters: {
          ...(isOwnContentTab ? { createdBy: userId ?? '' } : {}),
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
      // For reviewer tabs we filter client-side (exclude own content), so the API
      // total includes items we filter out. We still load until the API is exhausted
      // to ensure we don't miss any displayable items.
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
      const items = [...content, ...questionSets];
      // Exclude the reviewer's own content from reviewer tabs
      const filtered = isReviewerTab && userId
        ? items.filter((item) => item.createdBy !== userId)
        : items;
      return filtered.map(mapContentToWorkspaceItem);
    });
  }, [contentQuery.data, isReviewerTab, userId]);

  // Creator: use API count (stable from first page). Reviewer: use displayable count;
  // we filter client-side so we don't have a server-provided total for displayable
  // items—contents.length is correct once loading completes and grows as we load.
  const totalCount = isReviewerTab ? contents.length : (contentQuery.data?.pages[0]?.data?.count ?? 0);

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
    isCountsLoading: countsQuery.isLoading || (isReviewerMode && ownCountsQuery.isLoading),
    isRefreshing: contentQuery.isRefetching && !contentQuery.isLoading && !isFetchingNextPage,
    error: contentQuery.error,
    hasMore: !!hasNextPage,
    loadMore,
    refetchCounts,
    refetchAll,
  };
}
