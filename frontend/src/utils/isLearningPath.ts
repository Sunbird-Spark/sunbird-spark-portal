/**
 * True when a content item's `primaryCategory` identifies it as a Learning Path (case-insensitive).
 * Single source of truth, shared by anything that needs to branch Course vs. Learning Path behaviour
 * (routing, list filtering, recommendations, etc.).
 */
export function isLearningPathCategory(primaryCategory: string | undefined): boolean {
  return (primaryCategory ?? '').toLowerCase() === 'learning path';
}
