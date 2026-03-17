import type { HierarchyContentNode } from '@/types/collectionTypes';

/**
 * Build cdata array with course and batch identifiers for telemetry context.
 */
export function buildCollectionCdata(
  collectionId?: string,
  batchId?: string
): Array<{ id: string; type: string }> {
  const cdata: Array<{ id: string; type: string }> = [];
  if (collectionId) cdata.push({ id: collectionId, type: 'course' });
  if (batchId) cdata.push({ id: batchId, type: 'batch' });
  return cdata;
}

/**
 * Find the path from the root node to a content node with the given identifier.
 * Returns an array of nodes from root to target (inclusive), or null if not found.
 */
function findPathToContent(
  root: HierarchyContentNode,
  contentId: string
): HierarchyContentNode[] | null {
  if (root.identifier === contentId) return [root];

  if (root.children) {
    for (const child of root.children) {
      const path = findPathToContent(child, contentId);
      if (path) return [root, ...path];
    }
  }

  return null;
}

/**
 * Build objectRollup from collection hierarchy for telemetry context.
 * Returns an object like {l1: collectionId, l2: unitId, l3: subUnitId}
 * containing the ancestor identifiers (excluding the content leaf itself),
 * capped at 4 levels.
 */
export function buildObjectRollup(
  hierarchyRoot: HierarchyContentNode | null | undefined,
  contentId?: string
): Record<string, string> {
  if (!hierarchyRoot || !contentId) return {};

  const path = findPathToContent(hierarchyRoot, contentId);
  if (!path || path.length <= 1) return {};

  // Ancestors only (exclude the content leaf)
  const ancestors = path.slice(0, -1);
  const rollup: Record<string, string> = {};
  ancestors.forEach((node, index) => {
    if (index < 4) rollup[`l${index + 1}`] = node.identifier;
  });

  return rollup;
}
