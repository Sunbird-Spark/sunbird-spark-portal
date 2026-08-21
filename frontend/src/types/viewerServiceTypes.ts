import type { IssuedCertificate } from './TrackableCollections';

/**
 * Wire types for the Viewer Service (see `[Design] - Viewer Service.md`):
 * granular view-lifecycle APIs (start/update/assess/end/read) and summary
 * APIs (list/read/delete/download). Replaces the legacy
 * content/state/read|update + enrollment/list triad for Learning Path
 * consumption.
 *
 * The spec names fields `collectionId`/`contextId`; the live service (as of
 * writing) still returns `courseId`/`batchId` and omits `assessmentStatus`.
 * Both are declared here as optional so callers can read either shape —
 * `services/viewer/summaryMapper.ts` is the single place that normalises them.
 */

export interface AssessmentScoreEntry {
  /** Best score across attempts, not the latest attempt's score. */
  score: number;
  max_score: number;
  /**
   * Number of attempts made. Optional because the live service does not return
   * it yet - until it does, `useOptimisticViewerSummaryPatch` maintains a local
   * count so the UI can still show "attempt N of M".
   */
  attempts?: number;
}

export interface ViewerSummaryRecord {
  userId: string;
  /** Spec field name. */
  collectionId?: string;
  /** Live field name (legacy `courseId`). */
  courseId?: string;
  /** Spec field name. */
  contextId?: string;
  /** Live field name (legacy `batchId`). */
  batchId?: string;
  active: boolean;
  status: number;
  progress: number;
  completionPercentage?: number;
  contentStatus: Record<string, number>;
  /** Spec'd but not yet returned by the live service. */
  assessmentStatus?: Record<string, AssessmentScoreEntry>;
  collection?: {
    identifier: string;
    name?: string;
    logo?: string;
    leafNodesCount?: number;
    description?: string;
  };
  issuedCertificates?: IssuedCertificate[];
  enrolledDate?: string | number;
  completedOn?: string | number | null;
  lastReadContentId?: string | null;
  lastReadContentStatus?: number | null;
  lastContentAccessTime?: string | number | null;
  [key: string]: unknown;
}

export interface ViewerSummaryListResponse {
  /** Spec field name. */
  summary?: ViewerSummaryRecord[];
  /** Live field name. */
  response?: ViewerSummaryRecord[];
}

export interface ViewerSummaryReadResponse {
  summary?: ViewerSummaryRecord;
  response?: ViewerSummaryRecord;
}

export interface ViewRequest {
  userId: string;
  contentId: string;
  collectionId?: string;
  contextId?: string;
}

export interface ViewUpdateRequest extends ViewRequest {
  progressDetails?: Record<string, unknown>;
  /** Time spent in seconds. */
  timespent?: number;
}

/** Body for POST /v1/assessment/submit. */
export interface ViewAssessRequest extends ViewRequest {
  assessments: unknown[];
  /**
   * Identifies one attempt, so the service can count attempts instead of
   * collapsing every submission for a content into a single record. Mirrors the
   * legacy `content/state/update` `assessments[].attemptId`; regenerated on each
   * player START.
   */
  attemptId: string;
  /** Attempt start time (epoch ms), from the START telemetry event's `ets`. */
  assessmentTs: number;
  /** Attempt total, sent explicitly so the service need not re-derive it from raw events. */
  score?: number;
  /** Attempt maximum, sent explicitly alongside `score`. */
  maxScore?: number;
}

/** Params for DELETE /v1/summary/delete/:userId. Omit collectionId/contextId + all=true to delete every enrolment. */
export interface SummaryDeleteParams {
  userId: string;
  all?: boolean;
  collectionId?: string;
  contextId?: string;
}

export interface SummaryDownloadResponse {
  url: string;
}

export interface ViewReadRequest {
  userId: string;
  contentId: string[];
  collectionId?: string;
  contextId?: string;
}

/**
 * Live shape (confirmed) diverges heavily from the design doc's `{identifier,
 * progress, score, max_score}` placeholder:
 *  - keyed by `contentId`, not `identifier`
 *  - the actual progress value is inside `progressdetails`, a JSON-ENCODED
 *    STRING (e.g. `"{\"progress\":100}"`), not a plain `progress` number -
 *    the top-level `progress`/`completionPercentage` fields are `null`
 *  - `status` (0/1/2, the legacy content-status convention) is the more
 *    reliable completion signal when present
 *  - `courseId`/`batchId` mirror legacy field names; when both equal
 *    `contentId` the record was written under the design doc's "individual
 *    content, no collection context" scope (Scenario 1) rather than scoped to
 *    the collectionId/contextId that was actually requested/sent - a sign the
 *    write wasn't correctly scoped server-side.
 */
export interface ViewReadResponseContent {
  contentId?: string;
  /** Live field name. */
  courseId?: string;
  /** Live field name. */
  batchId?: string;
  /** 0 | 1 | 2, legacy content-status convention. */
  status?: number;
  /** JSON-encoded string, e.g. `"{\"progress\":100}"` - parse before use. */
  progressdetails?: string;
  /** Observed `null` on the live service; spec'd as a plain number. */
  completionPercentage?: number | null;
  /** Observed `null` on the live service; spec'd as a plain number. */
  progress?: number | null;
  lastAccessTime?: string | null;
  lastCompletedTime?: string | null;
  /** Spec field names, kept for forward-compat if the live shape converges on the doc. */
  identifier?: string;
  score?: number;
  max_score?: number;
  attempts?: number;
  [key: string]: unknown;
}

export interface ViewReadResponse {
  userId?: string;
  collectionId?: string;
  contextId?: string;
  /** Live field name. */
  response?: ViewReadResponseContent[];
  /** Spec field name. */
  contents?: ViewReadResponseContent[];
}

/**
 * Response for POST /v1/assessment/read.
 *
 * The only Viewer Service endpoint that could return saved assessment scores:
 * the verbatim live captures of `/v1/summary/list` (`summaryMapper.test.ts`) and
 * `/v1/view/read` (`viewReadMapper.test.ts`) carry no score, max_score or
 * attempts at all. Both shapes below are declared optional because the live
 * wire shape is still unconfirmed - `services/viewer/assessmentReadMapper.ts`
 * is the single place that normalises them.
 */
export interface AssessmentReadResponse {
  userId?: string;
  collectionId?: string;
  contextId?: string;
  /** Live field name (matches /v1/view/read's `response`, by analogy - unconfirmed). */
  response?: ViewReadResponseContent[];
  /**
   * Spec field name. `contentId`/`identifier` are declared here because entries
   * are useless without one - there would be no way to key a score to a content.
   */
  contents?: Array<{
    contentId?: string;
    identifier?: string;
    score?: number;
    max_score?: number;
    attempts?: number;
    [key: string]: unknown;
  }>;
}
