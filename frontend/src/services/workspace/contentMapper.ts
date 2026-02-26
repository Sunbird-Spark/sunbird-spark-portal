import type { ContentSearchItem, WorkspaceItem } from '../../types/workspaceTypes';

const STATUS_MAP: Record<string, WorkspaceItem['status']> = {
  Draft: 'draft',
  FlagDraft: 'draft',
  Review: 'review',
  Processing: 'review',
  FlagReview: 'review',
  Live: 'published',
  Unlisted: 'published',
};

const TYPE_MAP: Record<string, WorkspaceItem['type']> = {
  Content: 'content',
  Course: 'course',
  QuestionSet: 'quiz',
  Collection: 'collection',
};

export function mapContentToWorkspaceItem(item: ContentSearchItem): WorkspaceItem {
  return {
    id: item.identifier,
    title: item.name ?? 'Untitled',
    description: item.description ?? '',
    type: TYPE_MAP[item.objectType ?? ''] ?? 'content',
    status: STATUS_MAP[item.status ?? ''] ?? 'draft',
    thumbnail: item.posterImage ?? item.thumbnail ?? item.appIcon,
    createdAt: item.createdOn ?? null,
    updatedAt: item.lastUpdatedOn ?? item.createdOn ?? null,
    author: item.creator ?? item.createdBy ?? 'Unknown',
    primaryCategory: item.primaryCategory ?? '',
    contentType: item.contentType ?? '',
    mimeType: item.mimeType ?? '',
    framework: item.framework ?? '',
    contentStatus: item.status ?? '',
  };
}
