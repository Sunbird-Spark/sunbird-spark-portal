import type { RelatedContentItem, RelatedContentSearchItem } from '../../types/collectionTypes';

const RELATED_CONTENT_LIMIT = 3;

function isRootLevel(item: RelatedContentSearchItem): boolean {
  const visibility = (item.visibility ?? '').toLowerCase();
  return visibility === 'default' && !item.parent;
}

function isResourceItem(item: RelatedContentSearchItem): boolean {
  const mime = (item.mimeType ?? '').toLowerCase();
  const category = (item.primaryCategory ?? '').toLowerCase();
  if (mime.startsWith('video/') || mime === 'application/pdf' || mime === 'application/epub') return true;
  if (category.includes('course') || category.includes('textbook') || category.includes('collection')) return false;
  return true;
}

function filterAndSlice(
  items: RelatedContentSearchItem[] | undefined,
  excludeId?: string,
  limit: number = RELATED_CONTENT_LIMIT
): RelatedContentSearchItem[] {
  if (!items?.length) return [];
  return items
    .filter((item) => isRootLevel(item) && item.identifier !== excludeId)
    .slice(0, limit);
}

export function mapSearchContentToRelatedContentItems(
  items: RelatedContentSearchItem[] | undefined,
  excludeId?: string,
  limit: number = RELATED_CONTENT_LIMIT
): RelatedContentItem[] {
  const filtered = filterAndSlice(items, excludeId, limit);
  return filtered.map((item) => ({
    identifier: item.identifier,
    name: item.name ?? 'Untitled',
    appIcon: item.appIcon ?? item.posterImage ?? item.thumbnail ?? '',
    posterImage: item.posterImage ?? item.appIcon ?? item.thumbnail ?? '',
    mimeType: item.mimeType,
    primaryCategory: item.primaryCategory,
    cardType: isResourceItem(item) ? 'resource' : 'collection',
  }));
}
