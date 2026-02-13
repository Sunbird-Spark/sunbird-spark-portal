import type { RelatedContentSearchItem } from '../../types/collectionTypes';
import type { RelatedItem } from '../../data/collectionData';

const RELATED_CONTENT_LIMIT = 3;

function isRootLevel(item: RelatedContentSearchItem): boolean {
  const visibility = (item.visibility ?? '').toLowerCase();
  const hasParent = Boolean(item.parent);
  return visibility === 'default' && !hasParent;
}

function displayTypeFromItem(item: RelatedContentSearchItem): string {
  const mime = (item.mimeType ?? '').toLowerCase();
  const category = (item.primaryCategory ?? '').toLowerCase();
  const resourceType = (item.resourceType ?? '').toLowerCase();

  if (mime.startsWith('video/')) return 'Video';
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'application/epub') return 'Epub';
  if (mime.includes('html')) return 'HTML';

  if (resourceType === 'course' || category === 'course') return 'Course';
  if (resourceType === 'book' || category.includes('textbook')) return 'Textbook';
  if (resourceType === 'collection' || category === 'content playlist') return 'Collection';

  if (category.includes('resource') || resourceType === 'learn' || resourceType === 'teach') {
    return mime.startsWith('video/') ? 'Video' : mime === 'application/pdf' ? 'PDF' : 'PDF';
  }
  return 'Course';
}

function isResourceItem(item: RelatedContentSearchItem): boolean {
  const mime = (item.mimeType ?? '').toLowerCase();
  const category = (item.primaryCategory ?? '').toLowerCase();
  if (mime.startsWith('video/') || mime === 'application/pdf' || mime === 'application/epub') return true;
  if (category.includes('course') || category.includes('textbook') || category.includes('collection')) return false;
  return true;
}

export function mapSearchContentToRelatedItems(
  items: RelatedContentSearchItem[] | undefined,
  excludeId?: string,
  limit: number = RELATED_CONTENT_LIMIT
): RelatedItem[] {
  if (!items || !Array.isArray(items)) return [];

  const filtered = items
    .filter((item) => isRootLevel(item) && item.identifier !== excludeId)
    .slice(0, limit);

  return filtered.map((item) => {
    const type = displayTypeFromItem(item);
    const isResource = isResourceItem(item);
    const image = item.appIcon ?? item.posterImage ?? item.thumbnail ?? '';

    return {
      id: item.identifier,
      title: item.name ?? 'Untitled',
      type,
      image,
      isResource,
      lessons: item.leafNodesCount,
    };
  });
}
