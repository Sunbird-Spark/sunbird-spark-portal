import TreeModel from "tree-model";
import type { HierarchyContentNode } from "../../types/collectionTypes";

const COLLECTION_MIME = "application/vnd.ekstep.content-collection";

function isCollection(node: { mimeType?: string }): boolean {
  return (node.mimeType ?? "").toLowerCase() === COLLECTION_MIME;
}

/**
 * Parses the hierarchy root (API content) into a tree-model for traversal.
 * Root is the course/collection node; its children are top-level units.
 */
export function parseHierarchy(root: HierarchyContentNode): ReturnType<TreeModel["parse"]> | null {
  if (!root) return null;
  const model = new TreeModel();
  return model.parse(root);
}

/**
 * Returns content (leaf) identifiers in depth-first order.
 * Skips collection (unit) nodes; only includes playable content.
 */
export function getLeafContentIdsFromHierarchy(root: HierarchyContentNode | null): string[] {
  if (!root) return [];
  const tree = parseHierarchy(root);
  if (!tree) return [];
  const ids: string[] = [];
  tree.walk((node) => {
    if (!isCollection(node.model)) {
      ids.push(node.model.identifier);
    }
    return true;
  });
  return ids;
}

/**
 * Returns the first playable content identifier in depth-first order, or undefined.
 */
export function getFirstLeafContentIdFromHierarchy(root: HierarchyContentNode | null): string | undefined {
  if (!root) return undefined;
  const tree = parseHierarchy(root);
  if (!tree) return undefined;
  const first = tree.first((node) => !isCollection(node.model));
  return first?.model?.identifier;
}

/**
 * Finds a content node by identifier in the hierarchy (any depth). Returns the node or undefined.
 */
export function findNodeById(
  root: HierarchyContentNode | null | undefined,
  id: string
): HierarchyContentNode | undefined {
  if (!root || !id) return undefined;
  if (root.identifier === id) return root;
  const children = root.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const found = findNodeById(children[i], id);
    if (found) return found;
  }
  return undefined;
}
