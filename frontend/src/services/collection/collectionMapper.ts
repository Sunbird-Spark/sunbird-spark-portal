import type { HierarchyContentNode } from '../../types/collectionTypes';
import type { CollectionData, Module, Lesson } from '../../types/collectionTypes';

const DEFAULT_LESSON_DURATION = '—';
const DEFAULT_UNITS = 0;

function lessonTypeFromMimeType(mimeType?: string): 'video' | 'document' {
  if (!mimeType) return 'document';
  const lower = mimeType.toLowerCase();
  if (lower.startsWith('video/')) return 'video';
  return 'document';
}

function mapChildrenToLessons(children: HierarchyContentNode[] | undefined): Lesson[] {
  if (!children || !Array.isArray(children)) return [];
  return children.map((node) => ({
    id: node.identifier,
    title: node.name ?? 'Untitled',
    duration: DEFAULT_LESSON_DURATION,
    type: lessonTypeFromMimeType(node.mimeType),
  }));
}

function mapChildrenToModules(children: HierarchyContentNode[] | undefined): Module[] {
  if (!children || !Array.isArray(children)) return [];
  return children.map((unit) => ({
    id: unit.identifier,
    title: unit.name ?? 'Untitled',
    subtitle: unit.primaryCategory ?? unit.description ?? '',
    lessons: mapChildrenToLessons(unit.children),
  }));
}

export function mapToCollectionData(content: HierarchyContentNode): CollectionData {
  const modules = mapChildrenToModules(content.children);
  const units = modules.length > 0 ? modules.length : DEFAULT_UNITS;

  return {
    id: content.identifier,
    title: content.name ?? 'Untitled',
    lessons: content.leafNodesCount ?? 0,
    image: content.appIcon ?? '',
    units,
    description: content.description ?? '',
    audience: Array.isArray(content.audience) ? content.audience : [],
    modules,
  };
}
