/**
 * Filter constants used in workspace content search API calls.
 */

import type { ContentTypeFilter, WorkspaceView } from '@/types/workspaceTypes';

/** Content statuses to include in workspace search results. */
export const WORKSPACE_STATUS_FILTER = [
  'Draft',
  'FlagDraft',
  'Review',
  'Processing',
  'Live',
  'Unlisted',
  'FlagReview',
] as const;

/** Primary categories to include in workspace search results. */
export const WORKSPACE_PRIMARY_CATEGORY_FILTER = [
  'Course Assessment',
  'eTextbook',
  'Explanation Content',
  'Learning Resource',
  'Practice Question Set',
  'Teacher Resource',
  'Exam Question',
  'Content Playlist',
  'Course',
  'Digital Textbook',
  'Question paper',
] as const;

/** Number of items to fetch per page. */
export const WORKSPACE_PAGE_LIMIT = 20;

/**
 * Returns the backend status filter values for a given workspace tab.
 * The "all" tab sends the full status list so the API returns everything.
 */
export function getStatusFilterForTab(tab: WorkspaceView): string[] {
  switch (tab) {
    case 'drafts':
      return ['Draft', 'FlagDraft'];
    case 'review':
    case 'pending-review':
      return ['Review', 'Processing', 'FlagReview'];
    case 'published':
    case 'my-published':
      return ['Live', 'Unlisted'];
    case 'uploads':
      return ['Draft'];
    case 'collaborations':
      return ['Draft', 'FlagDraft', 'Review', 'Processing', 'Live', 'Unlisted', 'FlagReview'];
    case 'all':
    default:
      return [...WORKSPACE_STATUS_FILTER];
  }
}

/**
 * Maps a UI content-type filter to the backend primaryCategory values.
 * Returns `undefined` for "all" so no narrowing filter is applied.
 */
export function getPrimaryCategoryForTypeFilter(
  filter: ContentTypeFilter,
): string[] | undefined {
  switch (filter) {
    case 'course':
      return ['Course', 'Digital Textbook'];
    case 'content':
      return ['Learning Resource', 'Explanation Content', 'Teacher Resource', 'eTextbook'];
    case 'quiz':
      return ['Practice Question Set', 'Course Assessment', 'Exam Question', 'Question paper'];
    case 'collection':
      return ['Content Playlist'];
    case 'all':
    default:
      return undefined;
  }
}
