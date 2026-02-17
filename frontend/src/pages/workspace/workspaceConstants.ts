/**
 * Filter constants used in workspace content search API calls.
 */

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
