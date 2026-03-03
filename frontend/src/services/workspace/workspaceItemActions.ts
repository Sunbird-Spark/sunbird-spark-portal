import _ from 'lodash';
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
 * Creators can edit live/published content in addition to viewing it.
 */
export function getWorkspaceItemActionVisibility(
  status: WorkspaceItem['status'],
  userRole?: UserRole,
  contentStatus?: string,
): WorkspaceItemActionVisibility {
  // Content being processed server-side cannot be acted upon.
  if (_.toLower(contentStatus) === 'processing') {
    return { isDraft: false, isPublished: false, isReview: false, showView: false, showEdit: false, showDelete: false };
  }

  const isDraft = status === 'draft';
  const isPublished = status === 'published';
  const isReview = status === 'review';
  const isCreator = userRole === 'creator';

  return {
    isDraft,
    isPublished,
    isReview,
    showView: isPublished || isReview,
    showEdit: (!isPublished && !isReview) || (isCreator && isPublished),
    showDelete: isDraft,
  };
}