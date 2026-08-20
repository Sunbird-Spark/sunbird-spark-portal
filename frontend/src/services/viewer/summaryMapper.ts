import type {
  ViewerSummaryListResponse,
  ViewerSummaryReadResponse,
  ViewerSummaryRecord,
} from '../../types/viewerServiceTypes';

/**
 * Absorbs the wire-shape divergence between the Viewer Service spec and the
 * live service:
 *  - spec:  `result.summary[]`  with `collectionId` / `contextId`
 *  - live:  `result.response[]` with `courseId`     / `batchId`
 *
 * Every other module in the Learning Path flow reads only this normalised
 * shape — `collectionId` and `contextId` are always populated, regardless of
 * which wire shape the service returned.
 */
export function normaliseSummaryRecords(
  res: ViewerSummaryListResponse | null | undefined
): ViewerSummaryRecord[] {
  const records = res?.summary ?? res?.response ?? [];
  return records.map((record) => ({
    ...record,
    collectionId: record.collectionId ?? record.courseId,
    contextId: record.contextId ?? record.batchId,
  }));
}

/**
 * Same wire-shape normalisation as `normaliseSummaryRecords`, for the
 * single-record `/v1/summary/read` ("specific enrolment") response — spec:
 * `result.summary`, live: `result.response`.
 */
export function normaliseSummaryReadRecord(
  res: ViewerSummaryReadResponse | null | undefined
): ViewerSummaryRecord | undefined {
  const record = res?.summary ?? res?.response;
  if (!record) return undefined;
  return {
    ...record,
    collectionId: record.collectionId ?? record.courseId,
    contextId: record.contextId ?? record.batchId,
  };
}

/** Index normalised summary records by their (normalised) collectionId. Later records win on duplicate keys. */
export function indexSummaryByCollectionId(
  records: ViewerSummaryRecord[]
): Map<string, ViewerSummaryRecord> {
  const map = new Map<string, ViewerSummaryRecord>();
  records.forEach((record) => {
    if (record.collectionId) map.set(record.collectionId, record);
  });
  return map;
}

/**
 * Same shape as `indexSummaryByCollectionId`, but only includes a course's
 * record when it's a fan-out of THIS Learning Path's own context
 * (`<lpContextId>:<courseId>`) — see `buildCourseContextId`. Without this
 * scoping, a course id that also has a summary record from an unrelated
 * context (a different LP reusing the same course, a standalone enrolment)
 * leaks into this path's progress, showing a Level "Completed" before the
 * learner has ever enrolled in THIS path (`lpContextId` undefined —
 * see bug: unenrolled Learning Path showing Completed).
 */
export function buildCourseSummaryMapForContext(
  records: ViewerSummaryRecord[],
  lpContextId: string | undefined
): Map<string, ViewerSummaryRecord> {
  const map = new Map<string, ViewerSummaryRecord>();
  if (!lpContextId) return map;
  records.forEach((record) => {
    if (record.collectionId && record.contextId?.startsWith(`${lpContextId}:`)) {
      map.set(record.collectionId, record);
    }
  });
  return map;
}

/**
 * The path-root summary record — the one whose collectionId equals the
 * Learning Path's identifier. A user can end up enrolled in the same
 * Learning Path under more than one batch (observed live); picking the
 * wrong one means writes/reads for inner courses target a batch with no
 * fan-out records at all. Resolution order:
 *  1. Exact `contextId === preferredContextId` (e.g. the route's :contextId param).
 *  2. The LP record whose contextId is the prefix of an existing per-course
 *     fan-out composite context (`<thisContextId>:<courseId>`) — i.e. the
 *     batch the system actually fanned out into course enrolments.
 *  3. The record with the most recent `enrolledDate`.
 *  4. The first matching record (previous behaviour, last resort).
 */
export function getPathSummary(
  records: ViewerSummaryRecord[],
  pathId: string | undefined,
  preferredContextId?: string
): ViewerSummaryRecord | undefined {
  if (!pathId) return undefined;
  const candidates = records.filter((r) => r.collectionId === pathId);
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  if (preferredContextId) {
    const exact = candidates.find((r) => r.contextId === preferredContextId);
    if (exact) return exact;
  }

  const fannedOutContextPrefixes = new Set(
    records
      .map((r) => (r.contextId?.includes(':') ? r.contextId.slice(0, r.contextId.indexOf(':')) : undefined))
      .filter((prefix): prefix is string => !!prefix)
  );
  const withFanOut = candidates.find((r) => r.contextId && fannedOutContextPrefixes.has(r.contextId));
  if (withFanOut) return withFanOut;

  const byEnrolledDate = [...candidates].sort((a, b) => {
    const aTime = a.enrolledDate ? new Date(a.enrolledDate).getTime() : 0;
    const bTime = b.enrolledDate ? new Date(b.enrolledDate).getTime() : 0;
    return bTime - aTime;
  });
  return byEnrolledDate[0];
}

/** Composite context id used for a course enrolled as part of a Learning Path batch. */
export function buildCourseContextId(lpContextId: string, courseId: string): string {
  return `${lpContextId}:${courseId}`;
}

/**
 * The write/read context id for a course inside a Learning Path. Prefers the
 * per-course fan-out record's own `contextId` (the batch the system actually
 * enrolled the course under) over constructing `<lpContextId>:<courseId>`
 * blindly — with more than one LP enrolment, a constructed context id can
 * point at a batch with no fan-out record, so every write silently lands
 * unscoped ("individual content", per the design doc's Scenario 1).
 */
export function getCourseContextId(
  records: ViewerSummaryRecord[],
  lpContextId: string,
  courseId: string
): string {
  const fanOutRecords = records.filter(
    (r) => r.collectionId === courseId && r.contextId?.endsWith(`:${courseId}`)
  );
  const preferred = fanOutRecords.find((r) => r.contextId?.startsWith(`${lpContextId}:`));
  return (preferred ?? fanOutRecords[0])?.contextId ?? buildCourseContextId(lpContextId, courseId);
}

/**
 * Splits a composite `<lpContextId>:<courseId>` context id back into its parts.
 * Returns null for a plain (non-composite) context id.
 */
export function parseCourseContextId(
  contextId: string | undefined | null
): { lpContextId: string; courseId: string } | null {
  if (!contextId || !contextId.includes(':')) return null;
  const idx = contextId.indexOf(':');
  const lpContextId = contextId.slice(0, idx);
  const courseId = contextId.slice(idx + 1);
  if (!lpContextId || !courseId) return null;
  return { lpContextId, courseId };
}
