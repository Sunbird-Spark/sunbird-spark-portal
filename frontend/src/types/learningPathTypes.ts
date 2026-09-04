/**
 * Derived view model for a Learning Path (LP → Level → Course → CourseUnit →
 * Resource hierarchy). Built from `HierarchyContentNode` by
 * `services/learningPath/learningPathMapper.ts` — never persisted, never
 * read back from the API.
 */

export type LearningPathPolicy = 'Fixed' | 'Diagnostic' | 'PriorLearning';

export type LevelStatusKey =
  | 'completed'
  | 'active'
  | 'notStarted'
  | 'locked'
  | 'waived'
  | 'credited'
  | 'creditedPending';

/**
 * A node inside a Course's own hierarchy — either a CourseUnit (`isUnit`, may
 * nest further) or a playable leaf. Kept alongside the course's flattened
 * `leafIds` so the rail can show what's actually inside a course without
 * refetching its hierarchy.
 */
export interface LPUnitNode {
  identifier: string;
  name: string;
  mimeType?: string;
  primaryCategory?: string;
  isUnit: boolean;
  /** Leaf ids under this node (the node's own id when it is a leaf). */
  leafIds: string[];
  children: LPUnitNode[];
  /**
   * Attempt limit for self-assess leaves, carried through from the course
   * hierarchy so the rail can render "attempt N of M" the way the course
   * player's `ContentRow` does.
   */
  maxAttempts?: number;
}

/**
 * A normalised competency claim — what completing the content develops, and to what
 * proficiency level. `level` is a term code from the framework's `proficiencylevel`
 * category, absent only for legacy string-shaped tags that never carried one.
 *
 * Kept separate from `skills` on purpose: skills are a catalogue facet used for
 * display and filtering, whereas competencies are the authoritative capability claim
 * that attainment, waiving and the passbook are meant to be computed from.
 */
export interface LPCompetency {
  code: string;
  level?: string;
}

export interface LPCourseNode {
  identifier: string;
  name: string;
  primaryCategory?: string;
  mimeType?: string;
  leafNodesCount: number;
  leafIds: string[];
  /** The course's own children (units/leaves), preserved for the expandable rail rows. */
  units?: LPUnitNode[];
  /** Discovery facet: the union of the node's `skill` and `se_skills` terms. */
  skills: string[];
  /** Capability claims from the course's `competencyFramework`. */
  competencies: LPCompetency[];
  /** True when every leaf under this course is a QuML question set. */
  isAssessmentCourse: boolean;
  questionCount?: number;
}

export interface LPLevelNode {
  identifier: string;
  name: string;
  index: number;
  description?: string;
  /** Discovery facet — the Level's own terms, else the union of its courses'. */
  skills: string[];
  /** Capability claims — the Level's own, else the union of its courses'. */
  competencies: LPCompetency[];
  courses: LPCourseNode[];
}

export interface LearningPathModel {
  identifier: string;
  name: string;
  description?: string;
  policy: LearningPathPolicy;
  /** Content levels only — prior/outcome assessment levels are unwrapped and excluded. */
  levels: LPLevelNode[];
  /** Unwrapped from the first level, when it held exactly one assessment course. */
  priorAssessment?: LPCourseNode;
  /** Unwrapped from the last level, when it held exactly one assessment course. */
  outcomeAssessment?: LPCourseNode;
  allSkills: string[];
  courseTotal: number;
  leafTotal: number;
}

/** Per-course/level/path progress, derived from Viewer Service summary records. */
export interface ProgressInfo {
  pct: number;
  completed: number;
  total: number;
}

export interface LevelProgressInfo extends ProgressInfo {
  doneCourses: number;
}

export interface PathProgressInfo extends ProgressInfo {
  doneLevels: number;
  levelCount: number;
}

/** Waiver/credit status for a Level, derived from the Viewer Service's `optional_nodes` - see `deriveWaiversFromOptionalNodes`. */
export interface WaiverInfo {
  status: 'waived' | 'credited' | 'creditedPending';
  note: string;
}

export interface ResumeTarget {
  collectionId: string;
  contentId: string;
  contextId: string;
}

export interface AssessmentScore {
  score: number;
  maxScore: number;
}
