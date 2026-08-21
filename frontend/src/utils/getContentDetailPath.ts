import { isLearningPathCategory } from './isLearningPath';

/**
 * Resolves the consumption route for a piece of content: Learning Paths get
 * their own Ledger flow (`/learning-path/:id`), everything else keeps the
 * existing Course/Collection detail route (`/collection/:id`).
 */
export function getContentDetailPath(
  identifier: string,
  primaryCategory: string | undefined,
  batchId?: string
): string {
  const base = isLearningPathCategory(primaryCategory) ? `/learning-path/${identifier}` : `/collection/${identifier}`;
  return batchId ? `${base}/batch/${batchId}` : base;
}

/** The Learning Path status (skill-tracking timeline) route for a given path/enrolment. */
export function getLearningPathStatusPath(pathId: string, contextId?: string): string {
  const base = contextId ? `/learning-path/${pathId}/batch/${contextId}` : `/learning-path/${pathId}`;
  return `${base}/status`;
}
