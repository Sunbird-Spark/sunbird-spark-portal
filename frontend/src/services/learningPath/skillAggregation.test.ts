import { describe, it, expect } from 'vitest';
import { aggregateSkills, buildPathSkillSummary, filterPathSummaries } from './skillAggregation';
import type { LearningPathModel, LPCourseNode, LPLevelNode } from '../../types/learningPathTypes';
import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';

function course(overrides: Partial<LPCourseNode>): LPCourseNode {
  return {
    identifier: 'course',
    name: 'Course',
    leafNodesCount: 1,
    leafIds: ['leaf'],
    skills: [],
    competencies: [],
    isAssessmentCourse: false,
    ...overrides,
  };
}

function level(overrides: Partial<LPLevelNode>): LPLevelNode {
  return { identifier: 'lvl', name: 'Level', index: 0, competencies: [], skills: [], courses: [], ...overrides };
}

function model(overrides: Partial<LearningPathModel>): LearningPathModel {
  const levels = overrides.levels ?? [];
  const leafTotal = levels.flatMap((l) => l.courses).reduce((n, c) => n + c.leafIds.length, 0);
  return {
    identifier: 'path-1',
    name: 'My Path',
    policy: 'Fixed',
    levels,
    allSkills: [...new Set(levels.flatMap((l) => l.skills))],
    courseTotal: levels.reduce((n, l) => n + l.courses.length, 0),
    leafTotal,
    ...overrides,
  };
}

/** A path record whose given courses are marked fully complete via `contentStatus`. */
function pathSummary(doneLeafIds: string[]): ViewerSummaryRecord {
  const contentStatus = Object.fromEntries(doneLeafIds.map((id) => [id, 2]));
  return { contentStatus } as ViewerSummaryRecord;
}

describe('buildPathSkillSummary', () => {
  it('marks a fully-completed level\'s skills as gained', () => {
    const m = model({
      levels: [level({ identifier: 'l1', skills: ['a', 'b'], courses: [course({ identifier: 'c1', leafIds: ['leaf1'] })] })],
    });
    const summary = buildPathSkillSummary(m, pathSummary(['leaf1']), new Map());

    expect(summary.gainedSkills).toEqual(new Set(['a', 'b']));
    expect(summary.gainedCount).toBe(2);
    expect(summary.pendingCount).toBe(0);
    expect(summary.status).toBe('completed');
  });

  it('leaves later, locked levels\' skills pending under the Fixed policy', () => {
    const m = model({
      levels: [
        level({ identifier: 'l1', skills: ['a'], courses: [course({ identifier: 'c1', leafIds: ['leaf1'] })] }),
        level({ identifier: 'l2', skills: ['b'], courses: [course({ identifier: 'c2', leafIds: ['leaf2'] })] }),
      ],
    });
    const summary = buildPathSkillSummary(m, pathSummary(['leaf1']), new Map());

    expect(summary.gainedSkills).toEqual(new Set(['a']));
    expect(summary.pendingCount).toBe(1);
    expect(summary.status).toBe('ongoing');
  });

  it('records each skill\'s source level and when an attained level was completed', () => {
    const m = model({
      levels: [
        level({ identifier: 'l1', name: 'Foundations', skills: ['a'], courses: [course({ identifier: 'c1', leafIds: ['leaf1'] })] }),
        level({ identifier: 'l2', name: 'Advanced', skills: ['b'], courses: [course({ identifier: 'c2', leafIds: ['leaf2'] })] }),
      ],
    });
    const courseRecords = new Map<string, ViewerSummaryRecord>([
      [
        'c1',
        { contentStatus: { leaf1: 2 }, completionPercentage: 100, completedOn: 1_700_000_000_000 } as unknown as ViewerSummaryRecord,
      ],
    ]);

    const summary = buildPathSkillSummary(m, pathSummary(['leaf1']), courseRecords);

    expect(summary.skillSources).toEqual([
      { skill: 'a', levelId: 'l1', levelName: 'Foundations', levelIndex: 1, gained: true, gainedAt: 1_700_000_000_000 },
      { skill: 'b', levelId: 'l2', levelName: 'Advanced', levelIndex: 2, gained: false, gainedAt: undefined },
    ]);
  });

  it('reports not-started with no progress at all', () => {
    const m = model({
      levels: [level({ identifier: 'l1', skills: ['a'], courses: [course({ identifier: 'c1', leafIds: ['leaf1'] })] })],
    });
    const summary = buildPathSkillSummary(m, undefined, new Map());

    expect(summary.gainedSkills.size).toBe(0);
    expect(summary.status).toBe('not-started');
  });
});

describe('aggregateSkills', () => {
  it('returns zeroed tallies for no paths', () => {
    expect(aggregateSkills([])).toEqual({
      totalSkills: 0,
      gainedSkills: 0,
      pendingSkills: 0,
      pathsCompleted: 0,
      pathsOngoing: 0,
    });
  });

  it('unions skill names across paths so a skill gained anywhere counts once', () => {
    const a = buildPathSkillSummary(
      model({ levels: [level({ identifier: 'l1', skills: ['shared', 'a'], courses: [course({ identifier: 'c1', leafIds: ['leaf1'] })] })] }),
      pathSummary(['leaf1']),
      new Map()
    );
    const b = buildPathSkillSummary(
      model({
        identifier: 'path-2',
        levels: [level({ identifier: 'l2', skills: ['shared', 'b'], courses: [course({ identifier: 'c2', leafIds: ['leaf2'] })] })],
      }),
      undefined,
      new Map()
    );

    const aggregate = aggregateSkills([a, b]);
    expect(aggregate.totalSkills).toBe(3); // shared, a, b
    expect(aggregate.gainedSkills).toBe(2); // shared (via path a), a
    expect(aggregate.pendingSkills).toBe(1); // b
    expect(aggregate.pathsCompleted).toBe(1);
    expect(aggregate.pathsOngoing).toBe(0);
  });
});

describe('filterPathSummaries', () => {
  const completed = buildPathSkillSummary(
    model({
      identifier: 'p1',
      name: 'Data Basics',
      levels: [level({ identifier: 'l1', skills: ['SQL'], courses: [course({ identifier: 'c1', leafIds: ['leaf1'] })] })],
    }),
    pathSummary(['leaf1']),
    new Map()
  );
  const notStarted = buildPathSkillSummary(
    model({
      identifier: 'p2',
      name: 'Cloud Fundamentals',
      levels: [level({ identifier: 'l2', skills: ['AWS'], courses: [course({ identifier: 'c2', leafIds: ['leaf2'] })] })],
    }),
    undefined,
    new Map()
  );

  it('matches by path name, case-insensitively', () => {
    expect(filterPathSummaries([completed, notStarted], { query: 'data' })).toEqual([completed]);
  });

  it('matches by a skill name', () => {
    expect(filterPathSummaries([completed, notStarted], { query: 'aws' })).toEqual([notStarted]);
  });

  it('filters by status', () => {
    expect(filterPathSummaries([completed, notStarted], { status: 'not-started' })).toEqual([notStarted]);
  });

  it('returns everything with no filters', () => {
    expect(filterPathSummaries([completed, notStarted], {})).toEqual([completed, notStarted]);
  });
});
