import type { HierarchyContentNode, RawCompetencyClaim } from '../../types/collectionTypes';
import type {
  LearningPathModel,
  LearningPathPolicy,
  LPCompetency,
  LPCourseNode,
  LPLevelNode,
  LPUnitNode,
} from '../../types/learningPathTypes';
import { getLeafContentIdsFromHierarchy } from '../collection/hierarchyTree';

const QUESTIONSET_MIME_TYPES = ['application/vnd.sunbird.questionset', 'application/vnd.sunbird.question'];

/**
 * Maps every observed spelling of the root `policy` field to its canonical
 * code. The design doc's PascalCase codes (`Fixed`/`Diagnostic`/
 * `PriorLearning`) and the live authoring tool's lowercase design-label
 * values (`strict`/`adaptive`/`prior learning`, etc.) both need to resolve -
 * matched case-insensitively with non-alphanumeric characters stripped, so
 * `"Prior Learning"`, `"prior_learning"` and `"priorlearning"` all match.
 */
const POLICY_ALIASES: Record<string, LearningPathPolicy> = {
  fixed: 'Fixed',
  strict: 'Fixed',
  diagnostic: 'Diagnostic',
  adaptive: 'Diagnostic',
  priorlearning: 'PriorLearning',
};

/**
 * True when a node is a QuML question set: `objectType === 'QuestionSet'` or
 * one of the QuML mimeTypes. Legacy ECML assessment resources
 * (`application/vnd.ekstep.ecml-archive`) do NOT qualify.
 */
function isQuestionSetNode(node: HierarchyContentNode): boolean {
  if (node.objectType === 'QuestionSet') return true;
  return QUESTIONSET_MIME_TYPES.includes((node.mimeType ?? '').toLowerCase());
}

/** A Course qualifies as an assessment course iff every one of its leaves is a QuML question set. */
function isAssessmentCourse(courseNode: HierarchyContentNode, leafIds: string[]): boolean {
  if (leafIds.length === 0) return false;
  const leaves = collectLeafNodes(courseNode);
  return leaves.length > 0 && leaves.every(isQuestionSetNode);
}

/** Collects leaf (non-collection) nodes under a course node, mirroring getLeafContentIdsFromHierarchy's traversal. */
function collectLeafNodes(node: HierarchyContentNode): HierarchyContentNode[] {
  const isCollection = (node.mimeType ?? '').toLowerCase() === 'application/vnd.ekstep.content-collection';
  if (!isCollection) return [node];
  const children = node.children ?? [];
  return children.flatMap(collectLeafNodes);
}

const COLLECTION_MIME = 'application/vnd.ekstep.content-collection';

function isCollectionNode(node: HierarchyContentNode): boolean {
  return (node.mimeType ?? '').toLowerCase() === COLLECTION_MIME;
}

/**
 * Maps a node under a Course into the `LPUnitNode` tree the rail renders when a
 * course row is expanded. Unlike `getLeafContentIdsFromHierarchy` (which
 * flattens everything to ids), this keeps the CourseUnit nesting intact so the
 * sidebar can show "what's inside this course" as a tree.
 */
function mapUnitNode(node: HierarchyContentNode): LPUnitNode {
  const isUnit = isCollectionNode(node);
  const children = isUnit ? (node.children ?? []).map(mapUnitNode) : [];
  return {
    identifier: node.identifier,
    name: node.name ?? '',
    mimeType: node.mimeType,
    primaryCategory: node.primaryCategory,
    isUnit,
    leafIds: isUnit ? children.flatMap((c) => c.leafIds) : [node.identifier],
    children,
    ...(typeof node.maxAttempts === 'number' ? { maxAttempts: node.maxAttempts } : {}),
  };
}

/**
 * Unions the DISCOVERY facet only — `skill` and `se_skills`, which are the same
 * framework category arriving over the graph and the search transports respectively.
 *
 * `competencies` is deliberately not folded in here. It is a different axis and a
 * different shape (`{code, level}`), and merging the two flattened a levelled
 * capability claim into a bare display string — besides putting objects into a
 * `Set<string>`, which then reached React as a child and crashed the page.
 */
function unionSkills(...lists: Array<string[] | undefined>): string[] {
  const set = new Set<string>();
  lists.forEach((list) => (list ?? []).forEach((s) => s && set.add(s)));
  return Array.from(set);
}

/**
 * Normalises authored competency tags to `{code, level}`, accepting both the current
 * object shape and the bare strings earlier authoring wrote. Entries without a usable
 * code are dropped; duplicates are collapsed on code+level, so the same competency
 * claimed at two levels stays two claims (the framework's level ordering is not known
 * here, so this cannot pick the higher one).
 */
function normalizeCompetencies(raw: Array<RawCompetencyClaim | string> | undefined): LPCompetency[] {
  const seen = new Set<string>();
  const out: LPCompetency[] = [];
  (raw ?? []).forEach((entry) => {
    const code = (typeof entry === 'string' ? entry : entry?.code ?? '').trim();
    if (!code) return;
    const level = typeof entry === 'string' ? undefined : entry?.level?.trim() || undefined;
    const key = `${code}|${level ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(level ? { code, level } : { code });
  });
  return out;
}

/** Collapses competency claims from several nodes, keeping distinct code+level pairs. */
function unionCompetencies(lists: LPCompetency[][]): LPCompetency[] {
  return normalizeCompetencies(lists.flat());
}

function mapCourseNode(courseNode: HierarchyContentNode): LPCourseNode {
  const leafIds = getLeafContentIdsFromHierarchy(courseNode);
  const skills = unionSkills(courseNode.skill, courseNode.se_skills);
  const competencies = normalizeCompetencies(courseNode.competencies);
  const isAssessment = isAssessmentCourse(courseNode, leafIds);
  return {
    identifier: courseNode.identifier,
    name: courseNode.name ?? '',
    primaryCategory: courseNode.primaryCategory,
    mimeType: courseNode.mimeType,
    leafNodesCount: courseNode.leafNodesCount ?? leafIds.length,
    leafIds,
    units: (courseNode.children ?? []).map(mapUnitNode),
    skills,
    competencies,
    isAssessmentCourse: isAssessment,
    ...(isAssessment ? { questionCount: leafIds.length } : {}),
  };
}

function mapLevelNode(levelNode: HierarchyContentNode): LPLevelNode {
  const courses = (levelNode.children ?? []).map(mapCourseNode);
  // Each axis inherits from the Level's courses independently: a Level may declare its
  // own facets while leaving competencies to its courses, or the reverse.
  const ownSkills = unionSkills(levelNode.skill, levelNode.se_skills);
  const skills = ownSkills.length > 0 ? ownSkills : unionSkills(...courses.map((c) => c.skills));
  const ownCompetencies = normalizeCompetencies(levelNode.competencies);
  const competencies =
    ownCompetencies.length > 0 ? ownCompetencies : unionCompetencies(courses.map((c) => c.competencies));
  return {
    identifier: levelNode.identifier,
    name: levelNode.name ?? '',
    index: levelNode.index ?? 0,
    description: levelNode.description,
    skills,
    competencies,
    courses,
  };
}

function resolvePolicy(raw: string | undefined): LearningPathPolicy {
  const normalized = (raw ?? '').toLowerCase().replace(/[^a-z]/g, '');
  return POLICY_ALIASES[normalized] ?? 'Fixed';
}

/**
 * Parses a Learning Path hierarchy root into the derived `LearningPathModel`.
 * Role of the prior/outcome assessment Levels is derived — never stored:
 * the first Level unwraps to `priorAssessment` and the last to
 * `outcomeAssessment` when each holds exactly one assessment course. An
 * assessment course inside a middle Level stays a normal course in that
 * Level (badged "Question set only" in the UI), not unwrapped.
 */
export function parseLearningPath(root: HierarchyContentNode | null | undefined): LearningPathModel {
  if (!root) {
    return {
      identifier: '',
      name: '',
      policy: 'Fixed',
      levels: [],
      allSkills: [],
      courseTotal: 0,
      leafTotal: 0,
    };
  }

  const levelNodes = [...(root.children ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  let levels = levelNodes.map(mapLevelNode);

  let priorAssessment: LPCourseNode | undefined;
  const first = levels[0];
  if (first && first.courses.length === 1 && first.courses[0]?.isAssessmentCourse) {
    priorAssessment = first.courses[0];
    levels = levels.slice(1);
  }

  let outcomeAssessment: LPCourseNode | undefined;
  const last = levels[levels.length - 1];
  if (levels.length > 0 && last && last.courses.length === 1 && last.courses[0]?.isAssessmentCourse) {
    outcomeAssessment = last.courses[0];
    levels = levels.slice(0, -1);
  }

  const courseTotal =
    levels.reduce((sum, l) => sum + l.courses.length, 0) +
    (priorAssessment ? 1 : 0) +
    (outcomeAssessment ? 1 : 0);

  const allSkills = unionSkills(
    priorAssessment?.skills,
    ...levels.map((l) => l.skills),
    outcomeAssessment?.skills
  );

  return {
    identifier: root.identifier,
    name: root.name ?? '',
    description: root.description,
    policy: resolvePolicy(root.policy),
    levels,
    priorAssessment,
    outcomeAssessment,
    allSkills,
    courseTotal,
    leafTotal: root.leafNodesCount ?? getLeafContentIdsFromHierarchy(root).length,
  };
}

export { isAssessmentCourse };
