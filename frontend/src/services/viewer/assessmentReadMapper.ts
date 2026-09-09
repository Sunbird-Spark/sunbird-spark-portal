import type { AssessmentReadResponse } from '../../types/viewerServiceTypes';

/** One normalised `/v1/assessment/read` entry, keyed by whichever id field the item carried. */
export interface AssessmentReadEntry {
  contentId: string;
  score: number;
  maxScore: number;
  attempts?: number;
}

/**
 * Normalises the `response`/`contents` wire-shape divergence, same pattern as
 * `viewReadMapper.getViewReadItems` - the live shape is unconfirmed since this
 * endpoint has never been called in production (see `viewerServiceTypes.ts`).
 */
export function getAssessmentReadItems(
  response: AssessmentReadResponse | undefined | null
): NonNullable<AssessmentReadResponse['response'] | AssessmentReadResponse['contents']> {
  return response?.response ?? response?.contents ?? [];
}

/**
 * Normalise raw `/v1/assessment/read` items into a `contentId -> entry` map,
 * dropping any item with no id or no numeric score (both fields are
 * unconfirmed on the live service, so either could be absent).
 */
export function buildAssessmentReadMap(
  response: AssessmentReadResponse | undefined | null
): Record<string, AssessmentReadEntry> {
  const items = getAssessmentReadItems(response);
  const map: Record<string, AssessmentReadEntry> = {};
  items.forEach((item) => {
    const contentId = item.contentId ?? item.identifier;
    if (!contentId) return;
    if (typeof item.score !== 'number') return;
    map[contentId] = {
      contentId,
      score: item.score,
      maxScore: typeof item.max_score === 'number' ? item.max_score : 0,
      ...(typeof item.attempts === 'number' ? { attempts: item.attempts } : {}),
    };
  });
  return map;
}
