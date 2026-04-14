import type { HierarchyContentNode, CollectionData } from '../../types/collectionTypes';

const DEFAULT_UNITS = 0;

export function mapToCollectionData(content: HierarchyContentNode): CollectionData {
  const children = content.children ?? [];
  const units = children.length > 0 ? children.length : DEFAULT_UNITS;

  return {
    id: content.identifier,
    title: content.name ?? 'Untitled',
    lessons: content.leafNodesCount ?? 0,
    image: content.posterImage ?? content.appIcon ?? '',
    units,
    description: content.description ?? '',
    audience: Array.isArray(content.audience) ? content.audience : [],
    children,
    hierarchyRoot: content,
    trackable: content.trackable,
    createdBy: content.createdBy,
    primaryCategory: content.primaryCategory,
    channel: content.channel,
    userConsent: content.userConsent,
  };
}
