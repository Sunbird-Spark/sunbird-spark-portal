import { describe, it, expect } from 'vitest';
import { parseLearningPath } from './learningPathMapper';
import {
  computeCourseProgress,
  computeLevelProgress,
  isCertificateUnlocked,
  isOutcomeUnlocked,
  getResumeTarget,
  isLeafOptional,
} from './learningPathProgress';
import { LP_HIERARCHY_NO_ASSESSMENTS } from './__fixtures__/lpHierarchyNoAssessments.fixture';
import { LP_HIERARCHY_WITH_ASSESSMENTS } from './__fixtures__/lpHierarchyWithAssessments.fixture';
import { getOptionalNodeIds } from '../viewer/summaryMapper';
import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';

// Level-1: do_2146317426971115521341 -> course do_2146316303263006721126 ->
//   leaves do_21463158442296934411, do_214631592231313408130
// Level-2: do_2146317426971197441343 -> course do_214631618315042816133 ->
//   leaf do_214631615408873472110
const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);
const level1 = model.levels[0]!;
const level2 = model.levels[1]!;
const course1 = level1.courses[0]!;
const course2 = level2.courses[0]!;

function pathSummaryWith(optionalNodes: string[], contentStatus: Record<string, number> = {}): ViewerSummaryRecord {
  return {
    userId: 'u1',
    collectionId: model.identifier,
    contextId: 'batch_1',
    active: true,
    status: 1,
    progress: 0,
    contentStatus,
    optionalNodes,
  };
}

describe('optional_nodes — no-op regression guard', () => {
  // The sample /v1/summary/read response returns optional_nodes: [] today -
  // every function below must behave exactly as it did before this feature.
  it('computeCourseProgress: optional is false and percentages are unaffected with an empty optional set', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const result = computeCourseProgress(course1, summaryByCollectionId, pathSummaryWith([]));
    expect(result).toEqual({ pct: 0, completed: 0, total: 2, status: 'notStarted', optional: false });
  });

  it('computeLevelProgress: identical to the plain average with an empty optional set', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith([], { do_21463158442296934411: 2, do_214631592231313408130: 2 });
    const result = computeLevelProgress(level1, summaryByCollectionId, pathSummary);
    expect(result).toEqual({ pct: 100, completed: 1, total: 1, doneCourses: 1 });
  });

  it('getResumeTarget: unaffected with an empty optional set', () => {
    const pathSummary = pathSummaryWith([], { do_21463158442296934411: 2 });
    const target = getResumeTarget(model, pathSummary, [pathSummary]);
    expect(target?.contentId).toBe('do_214631592231313408130');
  });
});

describe('optional_nodes — course/level exclusion', () => {
  it('marks a course optional when its own id is in optional_nodes', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith([course1.identifier]);
    const result = computeCourseProgress(course1, summaryByCollectionId, pathSummary);
    expect(result.optional).toBe(true);
  });

  it('marks a course optional when every one of its leaves is in optional_nodes', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith(course1.leafIds);
    const result = computeCourseProgress(course1, summaryByCollectionId, pathSummary);
    expect(result.optional).toBe(true);
  });

  it('does not mark a course optional when only SOME of its leaves are optional', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith([course1.leafIds[0]!]);
    const result = computeCourseProgress(course1, summaryByCollectionId, pathSummary);
    expect(result.optional).toBe(false);
  });

  it('an optional id not present in this path does not shrink anything', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith(['do_unrelated_id']);
    expect(computeCourseProgress(course1, summaryByCollectionId, pathSummary).optional).toBe(false);
    expect(computeLevelProgress(level1, summaryByCollectionId, pathSummary)).toEqual({
      pct: 0,
      completed: 0,
      total: 1,
      doneCourses: 0,
    });
  });

  it('excludes an optional course from the Level mean - a single-course Level with its only course optional reports 100%', () => {
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith([course1.identifier]);
    const result = computeLevelProgress(level1, summaryByCollectionId, pathSummary);
    expect(result).toEqual({ pct: 100, completed: 0, total: 0, doneCourses: 0 });
  });

  it('a partially-optional Level averages only the required courses', () => {
    // Use the two-course Level from the assessments fixture (course_1a + course_1_assess).
    const fullModel = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);
    const level = fullModel.levels[0]!;
    expect(level.courses).toHaveLength(2);
    const [required, optionalCourse] = level.courses;
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>([
      [required!.identifier, { userId: 'u1', active: true, status: 2, progress: 1, contentStatus: {}, completionPercentage: 100 }],
    ]);
    const pathSummary = pathSummaryWith([optionalCourse!.identifier]);
    const result = computeLevelProgress(level, summaryByCollectionId, pathSummary);
    // Only the required course counts - fully done, so the Level is 100%,
    // not the 50% a naive two-course average would have produced.
    expect(result).toEqual({ pct: 100, completed: 1, total: 1, doneCourses: 1 });
  });

  it('an optional leaf the learner completed anyway is not penalised', () => {
    // Completing optional content is fine - it neither blocks nor is required.
    const summaryByCollectionId = new Map<string, ViewerSummaryRecord>();
    const pathSummary = pathSummaryWith(course1.leafIds, {
      do_21463158442296934411: 2,
      do_214631592231313408130: 2,
    });
    const result = computeCourseProgress(course1, summaryByCollectionId, pathSummary);
    expect(result.optional).toBe(true);
    // completionPercentage/contentStatus math is untouched by decision #1 -
    // completing it still shows as done, it just isn't required.
    expect(result.pct).toBe(100);
  });
});

describe('optional_nodes — outcome/certificate gating', () => {
  it('unlocks the outcome assessment when every level is complete or waived (via levelStatuses)', () => {
    const levelProgress = [
      { pct: 60, completed: 0, total: 1, doneCourses: 0 }, // still incomplete by pct alone
    ];
    expect(isOutcomeUnlocked(levelProgress)).toBe(false);
    expect(isOutcomeUnlocked(levelProgress, ['waived'])).toBe(true);
  });

  it('does not unlock via a non-skill-gaining status', () => {
    const levelProgress = [{ pct: 60, completed: 0, total: 1, doneCourses: 0 }];
    expect(isOutcomeUnlocked(levelProgress, ['locked'])).toBe(false);
  });

  it('unlocks the certificate through a waived level, once the outcome assessment is also done', () => {
    const levelProgress = [{ pct: 0, completed: 0, total: 1, doneCourses: 0 }];
    const outcomeProgress = { pct: 100, completed: 1, total: 1 };
    expect(isCertificateUnlocked(true, levelProgress, outcomeProgress, ['waived'])).toBe(true);
    expect(isCertificateUnlocked(true, levelProgress, outcomeProgress)).toBe(false);
  });

  it('existing callers that omit levelStatuses keep the pct-only behaviour', () => {
    const levelProgress = [{ pct: 100, completed: 1, total: 1, doneCourses: 1 }];
    expect(isOutcomeUnlocked(levelProgress)).toBe(true);
  });
});

describe('optional_nodes — getResumeTarget skips optional leaves', () => {
  it('skips an optional leaf and resumes at the next incomplete one', () => {
    const pathSummary = pathSummaryWith([course1.leafIds[0]!]);
    const target = getResumeTarget(model, pathSummary, [pathSummary]);
    expect(target?.contentId).toBe(course1.leafIds[1]);
  });

  it('still resumes at lastReadContentId even if it happens to be optional (deliberate open)', () => {
    const pathSummary = {
      ...pathSummaryWith(course1.leafIds),
      lastReadContentId: course1.leafIds[0]!,
    };
    const target = getResumeTarget(model, pathSummary, [pathSummary]);
    expect(target?.contentId).toBe(course1.leafIds[0]);
  });

  it('when every leaf is optional, resumes into the next course entirely', () => {
    const pathSummary = pathSummaryWith(course1.leafIds);
    const target = getResumeTarget(model, pathSummary, [pathSummary]);
    expect(target?.collectionId).toBe(course2.identifier);
    expect(target?.contentId).toBe(course2.leafIds[0]);
  });
});

describe('isLeafOptional', () => {
  it('reflects membership in the optional set', () => {
    const optional = getOptionalNodeIds(pathSummaryWith(['leaf_a']));
    expect(isLeafOptional(optional, 'leaf_a')).toBe(true);
    expect(isLeafOptional(optional, 'leaf_b')).toBe(false);
  });
});
