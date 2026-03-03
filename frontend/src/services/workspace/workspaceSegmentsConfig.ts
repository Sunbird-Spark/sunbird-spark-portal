import type {
  WorkspaceView,
  UserRole,
  WorkspaceSidebarCounts,
  WorkspaceSegment,
  WorkspaceSecondaryAction,
} from '../../types/workspaceTypes';

export function getCreatorSegments(counts: WorkspaceSidebarCounts): WorkspaceSegment[] {
  return [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'drafts', label: 'Drafts', count: counts.drafts },
    { id: 'review', label: 'Review', count: counts.review },
    { id: 'published', label: 'Published', count: counts.published },
  ];
}

export function getReviewerSegments(counts: WorkspaceSidebarCounts): WorkspaceSegment[] {
  return [
    { id: 'pending-review', label: 'Pending', count: counts.pendingReview ?? 0 },
    { id: 'my-published', label: 'Published', count: counts.published },
  ];
}

export function getSecondaryActions(userRole: UserRole): WorkspaceSecondaryAction[] {
  return userRole === 'creator'
    ? [
        { id: 'uploads', label: 'Uploads' },
        { id: 'collaborations', label: 'Collaborations' },
      ]
    : [];
}

export function shouldShowContentFilters(activeView: WorkspaceView): boolean {
  return !['create'].includes(activeView);
}
