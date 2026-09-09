import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';
import type { AssessmentScore } from '../../types/learningPathTypes';

/**
 * Best score plus attempt info for one assessment, as the Learning Path UI
 * renders it. Mirrors what `ContentAttemptInfo`/`ContentScoreInfo` provide on
 * the legacy course side (`services/collection/enrollmentMapper.ts`), but
 * sourced from the Viewer Service summary instead of `content/state/read`.
 */
export interface LPAssessmentInfo extends AssessmentScore {
  /**
   * Attempts made. Undefined when neither the service nor a local optimistic
   * patch has recorded one yet, in which case the UI shows score only.
   */
  attemptCount?: number;
}

/** `contentId -> info` map, the shape every source below (and their merge) produces. */
export type AssessmentInfoMap = Record<string, LPAssessmentInfo>;

/** A single source's score entry, before it is normalised into `LPAssessmentInfo`. */
export interface AssessmentSourceEntry {
  score: number;
  maxScore: number;
  attempts?: number;
}

function toInfo(entry: AssessmentSourceEntry): LPAssessmentInfo {
  return {
    score: entry.score,
    maxScore: entry.maxScore,
    ...(entry.attempts != null ? { attemptCount: entry.attempts } : {}),
  };
}

/**
 * Resolve an assessment's info out of an already-built `contentId -> info` map.
 *
 * Two id conventions collide here: submissions are written keyed by the leaf
 * `contentId` (see `useContentView.sendAssess`), whereas Learning Path callers
 * hold the assessment's *course* identifier (e.g. `model.priorAssessment.identifier`).
 * Checking the identifier first and then the course's leaf ids means both
 * callers resolve without either side having to know which convention
 * produced the entry.
 *
 * When several leaves carry entries (a multi-content assessment course) the
 * highest score wins, matching the legacy player's best-of-attempts semantics.
 */
export function resolveAssessmentInfo(
  identifier: string | undefined,
  leafIds: string[] | undefined,
  map: AssessmentInfoMap
): LPAssessmentInfo | null {
  const candidateIds = [...(identifier ? [identifier] : []), ...(leafIds ?? [])];
  let best: LPAssessmentInfo | null = null;
  candidateIds.forEach((id) => {
    const entry = map[id];
    if (!entry) return;
    if (best && entry.score <= best.score) return;
    best = entry;
  });
  return best;
}

/**
 * Build the `contentId -> info` map from the path record's `assessmentStatus`
 * alone. The weakest of the three sources merged by `mergeAssessmentSources` -
 * the live Viewer Service does not populate this field yet, so in practice this
 * only ever has data from the (fragile, cache-invalidation-prone) optimistic patch.
 */
export function buildAssessmentInfoMap(pathSummary: ViewerSummaryRecord | undefined): AssessmentInfoMap {
  const status = pathSummary?.assessmentStatus;
  if (!status) return {};
  const map: AssessmentInfoMap = {};
  Object.entries(status).forEach(([contentId, entry]) => {
    if (!entry) return;
    map[contentId] = toInfo({ score: entry.score, maxScore: entry.max_score, attempts: entry.attempts });
  });
  return map;
}

/**
 * Merge every source of assessment score/attempts into one map, in order of
 * trust: `/v1/assessment/read` (server, if it ever returns data) overrides the
 * durable local store (`assessmentScoreStore.ts`, which survives cache
 * invalidation and reloads), which overrides `pathSummary.assessmentStatus`
 * (in-memory only, wiped by the next `['viewerSummary']` refetch).
 */
export function mergeAssessmentSources(
  pathSummary: ViewerSummaryRecord | undefined,
  localMap: Record<string, AssessmentSourceEntry> = {},
  serverMap: Record<string, AssessmentSourceEntry> = {}
): AssessmentInfoMap {
  const merged: AssessmentInfoMap = { ...buildAssessmentInfoMap(pathSummary) };
  Object.entries(localMap).forEach(([contentId, entry]) => {
    merged[contentId] = toInfo(entry);
  });
  Object.entries(serverMap).forEach(([contentId, entry]) => {
    merged[contentId] = toInfo(entry);
  });
  return merged;
}

/**
 * Best score for an assessment course/content id, from the path record's
 * `assessmentStatus` alone. Kept for callers that only have `pathSummary` in
 * scope; prefer `resolveAssessmentInfo` with a `mergeAssessmentSources` map
 * wherever the local/server sources are available too.
 */
export function getAssessmentScore(
  identifier: string | undefined,
  pathSummary: ViewerSummaryRecord | undefined,
  leafIds?: string[]
): AssessmentScore | null {
  return resolveAssessmentInfo(identifier, leafIds, buildAssessmentInfoMap(pathSummary));
}

/** @deprecated Use `resolveAssessmentInfo` with a `mergeAssessmentSources` map. Kept for existing tests/callers. */
export function getAssessmentInfo(
  identifier: string | undefined,
  leafIds: string[] | undefined,
  pathSummary: ViewerSummaryRecord | undefined
): LPAssessmentInfo | null {
  return resolveAssessmentInfo(identifier, leafIds, buildAssessmentInfoMap(pathSummary));
}
