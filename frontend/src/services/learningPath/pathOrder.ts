import type { LPCourseNode, LearningPathModel } from '@/types/learningPathTypes';

export interface PathLeaf {
  courseId: string;
  contentId: string;
}

/**
 * Every leaf of a path in reading order, for "what comes next".
 *
 * INCLUDES THE ASSESSMENTS. `parseLearningPath` unwraps the prior and outcome assessments OFF
 * `levels` and onto the model, so an order built from `levels` alone omits them - which stranded a
 * learner on the entry assessment: it was not in the list, so there was no "next" and submitting it
 * advanced nowhere.
 *
 * Waived courses are skipped: a course the entry assessment marked optional is not where a learner
 * should be dropped next.
 */
export function pathLeavesInOrder(
  model: LearningPathModel,
  isOptional: (course: LPCourseNode) => boolean
): PathLeaf[] {
  const ofCourse = (course: LPCourseNode | undefined): PathLeaf[] =>
    !course || isOptional(course)
      ? []
      : course.leafIds.map((leaf) => ({ courseId: course.identifier, contentId: leaf }));

  return [
    ...ofCourse(model.priorAssessment),
    ...model.levels.flatMap((level) => level.courses.flatMap(ofCourse)),
    ...ofCourse(model.outcomeAssessment),
  ];
}

/** The leaf after the given one, or undefined at the end of the path. */
export function nextLeaf(
  leaves: PathLeaf[],
  courseId: string,
  contentId: string
): PathLeaf | undefined {
  const at = leaves.findIndex((l) => l.contentId === contentId && l.courseId === courseId);
  return at >= 0 ? leaves[at + 1] : undefined;
}
