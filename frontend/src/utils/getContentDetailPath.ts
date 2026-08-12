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
  const isLearningPath = (primaryCategory ?? '').toLowerCase() === 'learning path';
  const base = isLearningPath ? `/learning-path/${identifier}` : `/collection/${identifier}`;
  return batchId ? `${base}/batch/${batchId}` : base;
}
