import { describe, it, expect } from 'vitest';
import { computePathSkills } from './pathSkillStatus';
import type { LearningPathModel, LPCourseNode } from '@/types/learningPathTypes';

const course = (id: string, codes: string[]): LPCourseNode => ({
  identifier: id, name: id, leafNodesCount: 2, leafIds: [`${id}_a`, `${id}_b`],
  skills: [], skillCodes: codes, isAssessmentCourse: false,
});

const model = (courses: LPCourseNode[], all: string[]): LearningPathModel => ({
  identifier: 'lp', name: 'LP', policy: 'Fixed',
  levels: [{ identifier: 'l1', name: 'L1', index: 1, skills: [], skillCodes: [], courses }],
  allSkills: [], allSkillCodes: all, courseTotal: courses.length, leafTotal: courses.length * 2,
});

const m = model(
  [course('c1', ['dosage-calculation', 'iv-administration']), course('c2', ['hand-hygiene'])],
  ['dosage-calculation', 'iv-administration', 'hand-hygiene']
);

describe('computePathSkills', () => {
  it('reports a skill as held when the learner holds it', () => {
    const r = computePathSkills(m, new Set(['hand-hygiene']), new Map());
    expect(r.skills.find((s) => s.code === 'hand-hygiene')?.state).toBe('held');
  });

  // The point of the whole thing: partway through a course, its skills must not read "not started".
  it('reports in-progress with the teaching course percentage', () => {
    const r = computePathSkills(m, new Set(), new Map([['c1', { percent: 50 }]]));
    const s = r.skills.find((x) => x.code === 'dosage-calculation');
    expect(s?.state).toBe('inProgress');
    expect(s?.percent).toBe(50);
  });

  it('leaves an untouched skill as not started', () => {
    const r = computePathSkills(m, new Set(), new Map([['c1', { percent: 50 }]]));
    expect(r.skills.find((s) => s.code === 'hand-hygiene')?.state).toBe('notStarted');
  });

  // Held always wins: a completed course should not report its skills as 99% in progress.
  it('prefers held over in-progress', () => {
    const r = computePathSkills(m, new Set(['dosage-calculation']), new Map([['c1', { percent: 60 }]]));
    expect(r.skills.find((s) => s.code === 'dosage-calculation')?.state).toBe('held');
  });

  it('takes the best route when two courses teach the same skill', () => {
    const two = model(
      [course('c1', ['hand-hygiene']), course('c2', ['hand-hygiene'])], ['hand-hygiene']
    );
    const r = computePathSkills(two, new Set(), new Map([['c1', { percent: 20 }], ['c2', { percent: 80 }]]));
    expect(r.skills[0]?.percent).toBe(80);
  });

  // A role skill this path never teaches must still be listed, or readiness looks better than it is.
  it('lists a required skill the path does not teach, and flags it', () => {
    const r = computePathSkills(m, new Set(), new Map(), [
      'dosage-calculation', 'hmis-reporting',
    ]);
    const missing = r.skills.find((s) => s.code === 'hmis-reporting');
    expect(missing?.notTaught).toBe(true);
    expect(r.required).toBe(2);
  });

  it('computes readiness against the role requirement, not the path contents', () => {
    const r = computePathSkills(m, new Set(['dosage-calculation']), new Map(), [
      'dosage-calculation', 'hmis-reporting',
    ]);
    expect(r.held).toBe(1);
    expect(r.readiness).toBe(50);
  });

  it('falls back to the path contents when there is no target role', () => {
    const r = computePathSkills(m, new Set(['hand-hygiene']), new Map());
    expect(r.required).toBe(3);
    expect(r.held).toBe(1);
    expect(r.readiness).toBe(33);
  });
});
