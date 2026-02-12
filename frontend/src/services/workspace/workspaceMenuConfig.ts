import {
  FiPlus,
  FiFolder,
  FiEdit,
  FiSend,
  FiCheckCircle,
  FiUpload,
  FiUsers,
  FiClipboard,
} from 'react-icons/fi';
import type {
  WorkspaceSidebarCounts,
  WorkspaceMenuItem,
} from '../../types/workspaceTypes';

export type TranslateFn = (key: string) => string;

export function getCreatorMenuItems(
  counts: WorkspaceSidebarCounts,
  t: TranslateFn
): WorkspaceMenuItem[] {
  return [
    { id: 'create', label: t('createNew'), icon: FiPlus, highlight: true },
    { id: 'all', label: t('allMyContent'), icon: FiFolder, count: counts.all },
    { id: 'drafts', label: t('drafts'), icon: FiEdit, count: counts.drafts },
    { id: 'review', label: t('submittedForReview'), icon: FiSend, count: counts.review },
    { id: 'published', label: t('published'), icon: FiCheckCircle, count: counts.published },
    { id: 'uploads', label: t('allUploads'), icon: FiUpload },
    { id: 'collaborations', label: t('collaborations'), icon: FiUsers },
  ];
}

export function getReviewerMenuItems(counts: WorkspaceSidebarCounts): WorkspaceMenuItem[] {
  return [
    {
      id: 'pending-review',
      label: 'Pending Review',
      icon: FiClipboard,
      count: counts.pendingReview ?? 0,
    },
    {
      id: 'my-published',
      label: 'Published by Me',
      icon: FiCheckCircle,
      count: counts.published,
    },
  ];
}
