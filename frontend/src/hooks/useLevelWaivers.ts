import type { WaiverInfo } from '../types/learningPathTypes';

/**
 * Placeholder for per-Level waiver/credit state (Waived / Credited /
 * Credited · pending — see the Ledger design's Adaptive and Prior-learning
 * policies). No Viewer Service endpoint exists for this yet, so this always
 * returns an empty map; `deriveLevelStatuses` falls through to its
 * policy-derived lock/unlock logic when a Level has no waiver entry.
 *
 * Swap the body for a real query once a waiver/credit API exists — the
 * `Record<levelId, WaiverInfo>` return shape is what `deriveLevelStatuses`
 * already expects, so no caller changes should be needed.
 */
export function useLevelWaivers(_pathId: string | undefined): Record<string, WaiverInfo> {
  return {};
}
