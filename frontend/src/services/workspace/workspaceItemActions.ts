import type { WorkspaceItem } from '../../types/workspaceTypes';

export interface WorkspaceItemActionVisibility {
  isDraft: boolean;
  isPublished: boolean;
  isReview: boolean;
  showView: boolean;
  showEdit: boolean;
  showDelete: boolean;
}

/**
 * Derives action visibility for a workspace item based on status.
 */
export function getWorkspaceItemActionVisibility(
  status: WorkspaceItem['status']
): WorkspaceItemActionVisibility {
  const isDraft = status === 'draft';
  const isPublished = status === 'published';
  const isReview = status === 'review';

  return {
    isDraft,
    isPublished,
    isReview,
    showView: isPublished || isReview,
    showEdit: !isPublished && !isReview,
    showDelete: isDraft,
  };
}