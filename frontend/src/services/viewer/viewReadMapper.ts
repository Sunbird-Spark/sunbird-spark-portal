import type { ViewReadResponse, ViewReadResponseContent } from '../../types/viewerServiceTypes';

/** Normalises the `response`/`contents` wire-shape divergence, same pattern as `summaryMapper.ts`. */
export function getViewReadItems(response: ViewReadResponse | undefined | null): ViewReadResponseContent[] {
  return response?.response ?? response?.contents ?? [];
}

export function findViewReadItem(
  items: ViewReadResponseContent[],
  contentId: string
): ViewReadResponseContent | undefined {
  return items.find((item) => (item.contentId ?? item.identifier) === contentId);
}

/**
 * Resolves a completion status (0/1/2) from a `/v1/view/read` item. Prefers
 * the direct `status` field; falls back to parsing `progressdetails` (a
 * JSON-encoded string, e.g. `"{\"progress\":100}"`) since the live service
 * leaves the top-level `progress`/`completionPercentage` fields `null`.
 */
export function resolveViewReadStatus(item: ViewReadResponseContent | undefined): number | undefined {
  if (!item) return undefined;
  if (typeof item.status === 'number') return item.status;

  const progress = extractProgressDetailsValue(item);
  if (progress === undefined) return undefined;
  if (progress >= 100) return 2;
  if (progress > 0) return 1;
  return 0;
}

/** Parses `progressdetails` (JSON-encoded string) and returns its `progress` number, if present and valid. */
export function extractProgressDetailsValue(item: ViewReadResponseContent | undefined): number | undefined {
  if (!item?.progressdetails) return undefined;
  try {
    const parsed = JSON.parse(item.progressdetails) as { progress?: unknown };
    return typeof parsed?.progress === 'number' ? parsed.progress : undefined;
  } catch {
    return undefined;
  }
}

/**
 * True when a `/v1/view/read` item was recorded under the design doc's
 * "individual content, no collection context" scope (Scenario 1) - i.e. its
 * `courseId`/`batchId` both equal `contentId` - rather than the
 * collectionId/contextId that was actually requested. A record in this shape
 * won't be found by collection/context-scoped progress lookups.
 */
export function isIndividualScopeRecord(item: ViewReadResponseContent | undefined): boolean {
  if (!item) return false;
  return item.courseId === item.contentId && item.batchId === item.contentId;
}
