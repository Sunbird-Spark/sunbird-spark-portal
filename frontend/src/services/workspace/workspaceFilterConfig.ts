import type { SortOption, ContentTypeFilter } from '../../types/workspaceTypes';

export type TranslateFn = (key: string) => string;

export function getSortLabels(t: TranslateFn): Record<SortOption, string> {
  return {
    updated: t('lastUpdated'),
    created: t('dateCreated'),
    title: t('titleAZ'),
  };
}

export function getTypeLabels(t: TranslateFn): Record<ContentTypeFilter, string> {
  return {
    all: t('allTypes'),
    course: t('course'),
    content: t('content'),
    quiz: t('quiz'),
    collection: t('collection'),
  };
}
