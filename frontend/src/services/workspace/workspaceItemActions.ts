import type { WorkspaceItem, UserRole } from '../../types/workspaceTypes';

export interface WorkspaceItemActionVisibility {
  isDraft: boolean;
  isPublished: boolean;
  isReview: boolean;
  showView: boolean;
  showEdit: boolean;
  showDelete: boolean;
}

/**
 * Derives action visibility for a workspace item based on status and user role.
 *
 * Role-based rules:
 * - Creator + review status  → no view (content is under review, creator cannot view)
 * - Reviewer + published     → no view/edit (reviewer has no actions on live content)
 * - Creator + published      → view is shown (opens editor in edit mode, handled by caller)
 */
export function getWorkspaceItemActionVisibility(
  status: WorkspaceItem['status'],
  userRole?: UserRole,
): WorkspaceItemActionVisibility {
  const isDraft = status === 'draft';
  const isPublished = status === 'published';
  const isReview = status === 'review';

  let showView = isPublished || isReview;
  let showEdit = !isPublished && !isReview;
  const showDelete = isDraft;

  // Creator should not see "View" when content is under review
  if (userRole === 'creator' && isReview) {
    showView = false;
  }

  // Reviewer should not see "View" or "Edit" on published/live content
  if (userRole === 'reviewer' && isPublished) {
    showView = false;
    showEdit = false;
  }

  return {
    isDraft,
    isPublished,
    isReview,
    showView,
    showEdit,
    showDelete,
  };
}
