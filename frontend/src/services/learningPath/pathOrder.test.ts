import { describe, it, expect } from 'vitest';
import { pathLeavesInOrder, nextLeaf } from './pathOrder';
import type { LPCourseNode, LearningPathModel } from '@/types/learningPathTypes';

const course = (id: string, leaves: string[]): LPCourseNode => ({
  identifier: id, name: id, leafNodesCount: leaves.length, leafIds: leaves,
  skills: [], skillCodes: [], isAssessmentCourse: false,
});

const model = (over: Partial<LearningPathModel> = {}): LearningPathModel => ({
  identifier: 'lp', name: 'LP', policy: 'Diagnostic',
  levels: [
    { identifier: 'l1', name: 'L1', index: 1, skills: [], skillCodes: [],
      courses: [course('c1', ['c1a', 'c1b'])] },
    { identifier: 'l2', name: 'L2', index: 2, skills: [], skillCodes: [],
      courses: [course('c2', ['c2a'])] },
  ],
  priorAssessment: course('entry', ['entryQs']),
  outcomeAssessment: course('outcome', ['outcomeQs']),
  allSkills: [], allSkillCodes: [], courseTotal: 4, leafTotal: 5,
  ...over,
});

const never = () => false;

describe('pathLeavesInOrder', () => {
  // REGRESSION: parseLearningPath unwraps the assessments OFF `levels`, so an order built from
  // levels alone omitted them - a learner who submitted the entry assessment had no "next" and
  // stayed on the same page.
  it('puts the entry assessment first and the outcome last', () => {
    const ids = pathLeavesInOrder(model(), never).map((l) => l.contentId);
    expect(ids).toEqual(['entryQs', 'c1a', 'c1b', 'c2a', 'outcomeQs']);
  });

  it('gives the entry assessment a next leaf', () => {
    const leaves = pathLeavesInOrder(model(), never);
    expect(nextLeaf(leaves, 'entry', 'entryQs')).toEqual({ courseId: 'c1', contentId: 'c1a' });
  });

  it('carries across a course boundary', () => {
    const leaves = pathLeavesInOrder(model(), never);
    expect(nextLeaf(leaves, 'c1', 'c1b')).toEqual({ courseId: 'c2', contentId: 'c2a' });
  });

  it('has no next on the final leaf', () => {
    const leaves = pathLeavesInOrder(model(), never);
    expect(nextLeaf(leaves, 'outcome', 'outcomeQs')).toBeUndefined();
  });

  // A course the entry assessment waived is not where a learner should be dropped next.
  it('skips waived courses', () => {
    const leaves = pathLeavesInOrder(model(), (c) => c.identifier === 'c1');
    expect(leaves.map((l) => l.contentId)).toEqual(['entryQs', 'c2a', 'outcomeQs']);
    expect(nextLeaf(leaves, 'entry', 'entryQs')).toEqual({ courseId: 'c2', contentId: 'c2a' });
  });

  it('copes with a path that has no assessments', () => {
    const m = model();
    delete (m as Partial<LearningPathModel>).priorAssessment;
    delete (m as Partial<LearningPathModel>).outcomeAssessment;
    expect(pathLeavesInOrder(m, never).map((l) => l.contentId)).toEqual(['c1a', 'c1b', 'c2a']);
  });

  it('returns undefined for a leaf that is not on the path', () => {
    expect(nextLeaf(pathLeavesInOrder(model(), never), 'cX', 'zzz')).toBeUndefined();
  });
});
