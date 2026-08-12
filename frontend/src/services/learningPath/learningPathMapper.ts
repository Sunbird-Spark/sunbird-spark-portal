import type { HierarchyContentNode } from '../../types/collectionTypes';
import type {
  LearningPathModel,
  LearningPathPolicy,
  LPCourseNode,
  LPLevelNode,
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

function unionSkills(...lists: Array<string[] | undefined>): string[] {
  const set = new Set<string>();
  lists.forEach((list) => (list ?? []).forEach((s) => s && set.add(s)));
  return Array.from(set);
}

function mapCourseNode(courseNode: HierarchyContentNode): LPCourseNode {
  const leafIds = getLeafContentIdsFromHierarchy(courseNode);
  const skills = unionSkills(courseNode.competencies, courseNode.skill, courseNode.se_skills);
  const isAssessment = isAssessmentCourse(courseNode, leafIds);
  return {
    identifier: courseNode.identifier,
    name: courseNode.name ?? '',
    primaryCategory: courseNode.primaryCategory,
    mimeType: courseNode.mimeType,
    leafNodesCount: courseNode.leafNodesCount ?? leafIds.length,
    leafIds,
    skills,
    isAssessmentCourse: isAssessment,
    ...(isAssessment ? { questionCount: leafIds.length } : {}),
  };
}

function mapLevelNode(levelNode: HierarchyContentNode): LPLevelNode {
  const courses = (levelNode.children ?? []).map(mapCourseNode);
  const ownSkills = unionSkills(levelNode.competencies, levelNode.skill, levelNode.se_skills);
  const skills = ownSkills.length > 0 ? ownSkills : unionSkills(...courses.map((c) => c.skills));
  return {
    identifier: levelNode.identifier,
    name: levelNode.name ?? '',
    index: levelNode.index ?? 0,
    description: levelNode.description,
    skills,
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
