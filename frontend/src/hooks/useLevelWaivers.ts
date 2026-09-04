import { useMemo } from 'react';
import { useAppI18n } from './useAppI18n';
import type { LearningPathModel, WaiverInfo } from '../types/learningPathTypes';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';
import { deriveWaiversFromOptionalNodes } from '../services/learningPath/levelWaivers';

/**
 * Per-Level waiver/credit state, derived from the Viewer Service's
 * `optional_nodes` (see `deriveWaiversFromOptionalNodes`) - the prior
 * assessment's own record of which Levels/courses the learner was excused
 * from. `deriveLevelStatuses` falls through to its policy-derived lock/unlock
 * logic when a Level has no waiver entry, so an empty map (no `optional_nodes`
 * yet) is behaviour-identical to the old stub.
 *
 * `credited` / `creditedPending` never appear here - see
 * `deriveWaiversFromOptionalNodes`'s doc comment.
 */
export function useLevelWaivers(
  model: LearningPathModel,
  pathSummary: ViewerSummaryRecord | undefined,
  summaryByCollectionId?: Map<string, ViewerSummaryRecord>
): Record<string, WaiverInfo> {
  const { t } = useAppI18n();
  return useMemo(() => {
    const waivers = deriveWaiversFromOptionalNodes(model, pathSummary, summaryByCollectionId);
    // `note` is an i18n key on the pure derivation (so non-hook callers like
    // `skillAggregation.ts` can reuse it without a translation context) -
    // resolved to display text here, at the hook boundary that actually
    // renders it (`WaiverNote`).
    return Object.fromEntries(Object.entries(waivers).map(([levelId, w]) => [levelId, { ...w, note: t(w.note) }]));
  }, [model, pathSummary, summaryByCollectionId, t]);
}
