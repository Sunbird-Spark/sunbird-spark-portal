/**
 * Wire and view types for the competency APIs of the Viewer Service
 * (`/v1/competency/*`, Kong-fronted as `/competency/v1/*`).
 *
 * WHO THE RESPONSE IS ABOUT: every learner-facing endpoint takes the user id
 * from the auth token, never the body (`CompetencyController.authUserId`), so
 * requests here must NOT carry a `userId`. One learner cannot read another's
 * passbook by construction.
 *
 * Unlike the Viewer Service's view/summary APIs, these take `frameworkId` and
 * `position` verbatim - there is no `collectionId`/`courseId` translation to do,
 * so no `toWireIds` equivalent is needed.
 */

/** `POST /competency/v1/passbook/read` - one entry per competency held. */
export interface PassbookEntryWire {
  competencyId?: string;
  frameworkId?: string;
  level?: string;
  levelIndex?: number;
  /** IN_PROGRESS | ATTAINED | EXPIRING | EXPIRED - see the design's status table. */
  status?: string;
  sourceType?: string;
  attainedOn?: string;
  expiresOn?: string;
  /** Present only when the request asked for `evidence: true`. */
  evidence?: EvidenceWire[];
}

export interface EvidenceWire {
  evidenceId?: string;
  level?: string;
  sourceType?: string;
  sourceId?: string;
  score?: number;
  maxScore?: number;
  occurredOn?: string;
  expiresOn?: string;
}

/**
 * NOTE ON THE ENVELOPE: `AxiosAdapter.mapResponse` already unwraps `result`
 * (`_.get(data, 'result')`, falling back to the whole body), so what reaches a
 * mapper is the CONTENTS of `result`, not the Sunbird envelope. Declaring
 * `result` here made the mappers look one level too deep and render an empty
 * passbook against a perfectly good 200. Both shapes are accepted so the
 * mappers survive either.
 */
export interface PassbookReadResponse {
  competencies?: PassbookEntryWire[];
  count?: number;
  result?: { competencies?: PassbookEntryWire[]; count?: number };
}

/** `POST /competency/v1/gap/read` - required vs held, per requirement. */
export interface GapRowWire {
  competencyId?: string;
  requiredLevel?: string;
  requiredLevelIndex?: number;
  heldLevel?: string;
  heldLevelIndex?: number;
  criticality?: string;
  /** MET | BELOW | MISSING */
  status?: string;
}

export interface GapReadResponseBody {
  gap?: GapRowWire[];
  readiness?: number;
  position?: string;
  frameworkId?: string;
  mandatoryOutstanding?: number;
}

export interface GapReadResponse extends GapReadResponseBody {
  result?: GapReadResponseBody;
}

/** `GET /competency/v1/framework/read/:frameworkId` - the resolved framework. */
export interface FrameworkLevelWire {
  code?: string;
  index?: number;
  cutScore?: number;
  minEvidenceCount?: number;
  validityMonths?: number;
}

export interface RequirementWire {
  competencyId?: string;
  requiredLevel?: string;
  requiredLevelIndex?: number;
  criticality?: string;
}

export interface CompetencyFrameworkReadBody {
  frameworkId?: string;
  levels?: FrameworkLevelWire[];
  /** Keyed by position code. */
  requirements?: Record<string, RequirementWire[]>;
  defaultRequiredLevel?: string;
  maxCompletionDerivedIndex?: number;
}

export interface CompetencyFrameworkReadResponse extends CompetencyFrameworkReadBody {
  result?: CompetencyFrameworkReadBody;
}

// ---- view types (what the components consume) -----------------------------------------------

export const PASSBOOK_STATUS = {
  inProgress: 'IN_PROGRESS',
  attained: 'ATTAINED',
  expiring: 'EXPIRING',
  expired: 'EXPIRED',
} as const;

export const GAP_STATUS = {
  met: 'MET',
  below: 'BELOW',
  missing: 'MISSING',
} as const;

export interface Evidence {
  evidenceId: string;
  level: string;
  sourceType: string;
  sourceId: string;
  score?: number;
  maxScore?: number;
  occurredOn?: number;
}

export interface PassbookEntry {
  competencyId: string;
  frameworkId: string;
  level: string;
  levelIndex: number;
  status: string;
  sourceType: string;
  attainedOn?: number;
  expiresOn?: number;
  evidence: Evidence[];
}

export interface GapRow {
  competencyId: string;
  requiredLevel: string;
  requiredLevelIndex: number;
  heldLevel: string;
  heldLevelIndex: number;
  criticality: string;
  status: string;
}

export interface CompetencyGap {
  rows: GapRow[];
  readiness: number;
  position: string;
  frameworkId: string;
  mandatoryOutstanding: number;
  /**
   * False when the service answered without a position, which it reports as
   * `readiness: 0` with an empty gap. That zero means "unknown", not "0% ready",
   * and must never be rendered as a score.
   */
  resolved: boolean;
}

export interface CompetencyFrameworkMeta {
  frameworkId: string;
  levels: FrameworkLevelWire[];
  requirements: Record<string, RequirementWire[]>;
  /** Position codes that declare at least one requirement. */
  positions: string[];
}
