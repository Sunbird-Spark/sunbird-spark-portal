import type { RelatedContentItem, RelatedContentSearchItem } from '../../types/collectionTypes';

const RELATED_CONTENT_LIMIT = 3;

function isRootLevel(item: RelatedContentSearchItem): boolean {
  const visibility = (item.visibility ?? '').toLowerCase();
  return visibility === 'default' && !item.parent;
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
    cardType: (item.mimeType ?? '').toLowerCase() === 'application/vnd.ekstep.content-collection' ? 'collection' : 'resource',
    leafNodesCount: item.leafNodesCount,
    creator: item.creator ?? item.createdBy ?? 'Unknown',
  }));
}
