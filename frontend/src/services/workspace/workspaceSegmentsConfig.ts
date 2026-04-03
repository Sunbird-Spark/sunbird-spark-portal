import type {
  WorkspaceView,
  UserRole,
  WorkspaceSidebarCounts,
  WorkspaceSegment,
  WorkspaceSecondaryAction,
} from '../../types/workspaceTypes';

export function getCreatorSegments(counts: WorkspaceSidebarCounts): WorkspaceSegment[] {
  return [
    { id: 'all', label: 'workspace.segments.all', count: counts.all },
    { id: 'drafts', label: 'workspace.segments.drafts', count: counts.drafts },
    { id: 'review', label: 'workspace.segments.review', count: counts.review },
    { id: 'published', label: 'workspace.segments.published', count: counts.published },
  ];
}

export function getReviewerSegments(counts: WorkspaceSidebarCounts): WorkspaceSegment[] {
  return [
    { id: 'pending-review', label: 'workspace.segments.pending', count: counts.pendingReview ?? 0 },
    { id: 'my-published', label: 'workspace.segments.published', count: counts.published },
  ];
}

export function getSecondaryActions(userRole: UserRole, isBookCreatorOnly = false): WorkspaceSecondaryAction[] {
  if (userRole !== 'creator') return [];
  if (isBookCreatorOnly) {
    return [{ id: 'collaborations', label: 'workspace.secondaryActions.collaborations' }];
  }
  return [
    { id: 'uploads', label: 'workspace.secondaryActions.uploads' },
    { id: 'collaborations', label: 'workspace.secondaryActions.collaborations' },
  ];
}

export function shouldShowContentFilters(activeView: WorkspaceView): boolean {
  return !['create'].includes(activeView);
}
