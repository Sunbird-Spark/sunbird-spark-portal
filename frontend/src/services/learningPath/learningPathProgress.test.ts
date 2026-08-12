import { describe, it, expect } from 'vitest';
import { parseLearningPath } from './learningPathMapper';
import {
  computeCourseProgress,
  computeLevelProgress,
  computePathProgress,
  deriveLevelStatuses,
  isOutcomeUnlocked,
  getAssessmentScore,
  getResumeTarget,
} from './learningPathProgress';
import { LP_HIERARCHY_NO_ASSESSMENTS } from './__fixtures__/lpHierarchyNoAssessments.fixture';
import { LP_HIERARCHY_WITH_ASSESSMENTS } from './__fixtures__/lpHierarchyWithAssessments.fixture';
import { normaliseSummaryRecords, getPathSummary, indexSummaryByCollectionId } from '../viewer/summaryMapper';
import type { ViewerSummaryListResponse, ViewerSummaryRecord } from '../../types/viewerServiceTypes';

// Real /v1/summary/list/{userId} response for the known-good account — all three records at 100%.
const ALL_DONE_RESPONSE: ViewerSummaryListResponse = {
  response: [
    {
      batchId: '0146338062206566400:do_214631618315042816133',
      userId: 'b8bc0092-2dbc-457b-8fc4-100664df1bb9',
      contentStatus: { do_214631615408873472110: 2 },
      completionPercentage: 100,
      progress: 1,
      lastReadContentId: null,
      courseId: 'do_214631618315042816133',
      status: 2,
      active: true,
    } as unknown as ViewerSummaryRecord,
    {
      batchId: '0146338062206566400:do_2146316303263006721126',
      userId: 'b8bc0092-2dbc-457b-8fc4-100664df1bb9',
      contentStatus: { do_21463158442296934411: 2, do_214631592231313408130: 2 },
      completionPercentage: 100,
      progress: 2,
      lastReadContentId: 'do_214631592231313408130',
      courseId: 'do_2146316303263006721126',
      status: 2,
      active: true,
    } as unknown as ViewerSummaryRecord,
    {
      batchId: '0146338062206566400',
      userId: 'b8bc0092-2dbc-457b-8fc4-100664df1bb9',
      contentStatus: {
        do_21463158442296934411: 2,
        do_214631592231313408130: 2,
        do_214631615408873472110: 2,
      },
      completionPercentage: 100,
      progress: 3,
      lastReadContentId: 'do_214631615408873472110',
      courseId: 'do_2146317230884208641312',
      status: 2,
      active: true,
    } as unknown as ViewerSummaryRecord,
  ],
};

// A partial-progress variant: Level-1's course fully done, Level-2's course untouched.
const PARTIAL_RESPONSE: ViewerSummaryListResponse = {
  response: [
    {
      batchId: '0146338062206566400:do_2146316303263006721126',
      userId: 'user-1',
      contentStatus: { do_21463158442296934411: 2, do_214631592231313408130: 2 },
      completionPercentage: 100,
      progress: 2,
      lastReadContentId: 'do_214631592231313408130',
      courseId: 'do_2146316303263006721126',
      status: 2,
      active: true,
    } as unknown as ViewerSummaryRecord,
    {
      batchId: '0146338062206566400',
      userId: 'user-1',
      contentStatus: { do_21463158442296934411: 2, do_214631592231313408130: 2 },
      completionPercentage: 66,
      progress: 2,
      lastReadContentId: 'do_214631592231313408130',
      courseId: 'do_2146317230884208641312',
      status: 1,
      active: true,
    } as unknown as ViewerSummaryRecord,
  ],
};

describe('computeCourseProgress', () => {
  const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);
  const course1 = model.levels[0]!.courses[0]!; // do_2146316303263006721126, 2 leaves

  it('uses the course record completionPercentage when present', () => {
    const records = normaliseSummaryRecords(ALL_DONE_RESPONSE);
    const byId = indexSummaryByCollectionId(records);

    const result = computeCourseProgress(course1, byId);
    expect(result.pct).toBe(100);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(2);
    expect(result.status).toBe('completed');
  });

  it('falls back to the path record contentStatus map when no per-course record exists', () => {
    const records = normaliseSummaryRecords(PARTIAL_RESPONSE);
    const byId = indexSummaryByCollectionId(records);
    const pathSummary = getPathSummary(records, 'do_2146317230884208641312');

    // course2 (Level-2, do_214631618315042816133) has no dedicated record in PARTIAL_RESPONSE.
    const course2 = model.levels[1]!.courses[0]!;
    const result = computeCourseProgress(course2, byId, pathSummary);

    expect(result.total).toBe(1);
    expect(result.completed).toBe(0);
    expect(result.pct).toBe(0);
    expect(result.status).toBe('notStarted');
  });

  it('returns zero progress when the user is not enrolled (no records at all)', () => {
    const result = computeCourseProgress(course1, new Map());
    expect(result).toEqual({ pct: 0, completed: 0, total: 2, status: 'notStarted' });
  });

  // Regression: a stale aggregate completionPercentage must never mask a
  // just-completed leaf confirmed via the optimistic patch / summary/read.
  it('takes the max of completionPercentage and contentStatus-derived progress (stale aggregate)', () => {
    const staleRecord = {
      collectionId: course1.identifier,
      contextId: 'batch:course',
      active: true,
      status: 1,
      progress: 0,
      completionPercentage: 0,
      contentStatus: { do_21463158442296934411: 2, do_214631592231313408130: 2 },
    } as unknown as ViewerSummaryRecord;
    const byId = indexSummaryByCollectionId([staleRecord]);

    const result = computeCourseProgress(course1, byId);
    expect(result.pct).toBe(100);
    expect(result.completed).toBe(2);
    expect(result.status).toBe('completed');
  });

  it('takes the max the other way round: a fresh aggregate is not masked by a stale/empty contentStatus', () => {
    const record = {
      collectionId: course1.identifier,
      contextId: 'batch:course',
      active: true,
      status: 2,
      progress: 2,
      completionPercentage: 100,
      contentStatus: {},
    } as unknown as ViewerSummaryRecord;
    const byId = indexSummaryByCollectionId([record]);

    const result = computeCourseProgress(course1, byId);
    expect(result.pct).toBe(100);
    expect(result.status).toBe('completed');
  });
});

describe('computeLevelProgress / computePathProgress', () => {
  const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

  it('reports 100% path and level progress for the known-good, fully-completed account', () => {
    const records = normaliseSummaryRecords(ALL_DONE_RESPONSE);
    const byId = indexSummaryByCollectionId(records);
    const pathSummary = getPathSummary(records, model.identifier);

    const pathProgress = computePathProgress(model, pathSummary, byId);
    expect(pathProgress.pct).toBe(100);
    expect(pathProgress.doneLevels).toBe(2);
    expect(pathProgress.levelCount).toBe(2);

    model.levels.forEach((level) => {
      const levelProgress = computeLevelProgress(level, byId, pathSummary);
      expect(levelProgress.pct).toBe(100);
      expect(levelProgress.doneCourses).toBe(1);
    });
  });

  it('reports partial progress correctly: Level-1 done, Level-2 not started', () => {
    const records = normaliseSummaryRecords(PARTIAL_RESPONSE);
    const byId = indexSummaryByCollectionId(records);
    const pathSummary = getPathSummary(records, model.identifier);

    const pathProgress = computePathProgress(model, pathSummary, byId);
    expect(pathProgress.pct).toBe(66);
    expect(pathProgress.doneLevels).toBe(1);

    expect(computeLevelProgress(model.levels[0]!, byId, pathSummary).pct).toBe(100);
    expect(computeLevelProgress(model.levels[1]!, byId, pathSummary).pct).toBe(0);
  });

  it('returns zero path progress for a not-enrolled user (no summary record)', () => {
    const result = computePathProgress(model, undefined, new Map());
    expect(result).toEqual({ pct: 0, completed: 0, total: model.leafTotal, doneLevels: 0, levelCount: 2 });
  });
});

describe('deriveLevelStatuses', () => {
  const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

  it('Fixed policy: sequential unlock — Level 2 is locked until Level 1 is complete', () => {
    const partial = [
      { pct: 100, completed: 2, total: 2, doneCourses: 1 },
      { pct: 0, completed: 0, total: 1, doneCourses: 0 },
    ];
    const statuses = deriveLevelStatuses(model, 'Fixed', partial, true);
    expect(statuses).toEqual(['completed', 'notStarted']);
  });

  it('Fixed policy: Level 2 stays locked while Level 1 is only partially done', () => {
    const partial = [
      { pct: 50, completed: 0, total: 2, doneCourses: 0 },
      { pct: 0, completed: 0, total: 1, doneCourses: 0 },
    ];
    const statuses = deriveLevelStatuses(model, 'Fixed', partial, true);
    expect(statuses).toEqual(['active', 'locked']);
  });

  it('Diagnostic policy: everything is locked until the prior assessment is complete', () => {
    const partial = [
      { pct: 0, completed: 0, total: 2, doneCourses: 0 },
      { pct: 0, completed: 0, total: 1, doneCourses: 0 },
    ];
    const lockedBoth = deriveLevelStatuses(model, 'Diagnostic', partial, false);
    expect(lockedBoth).toEqual(['locked', 'locked']);

    const openBoth = deriveLevelStatuses(model, 'Diagnostic', partial, true);
    expect(openBoth).toEqual(['notStarted', 'notStarted']);
  });

  it('a waiver entry overrides the derived status', () => {
    const partial = [
      { pct: 0, completed: 0, total: 2, doneCourses: 0 },
      { pct: 0, completed: 0, total: 1, doneCourses: 0 },
    ];
    const statuses = deriveLevelStatuses(model, 'Diagnostic', partial, false, {
      [model.levels[0]!.identifier]: { status: 'waived', note: 'Waived — scored 5/5' },
    });
    expect(statuses[0]).toBe('waived');
    expect(statuses[1]).toBe('locked');
  });
});

describe('isOutcomeUnlocked', () => {
  it('unlocks only when every Level is 100%', () => {
    expect(isOutcomeUnlocked([{ pct: 100, completed: 1, total: 1, doneCourses: 1 }])).toBe(true);
    expect(
      isOutcomeUnlocked([
        { pct: 100, completed: 1, total: 1, doneCourses: 1 },
        { pct: 90, completed: 0, total: 1, doneCourses: 0 },
      ])
    ).toBe(false);
    expect(isOutcomeUnlocked([])).toBe(false);
  });
});

describe('getAssessmentScore', () => {
  it('returns the score when assessmentStatus is present (spec-shaped response)', () => {
    const record = {
      assessmentStatus: { qs_outcome: { score: 25, max_score: 30 } },
    } as unknown as ViewerSummaryRecord;

    expect(getAssessmentScore('qs_outcome', record)).toEqual({ score: 25, maxScore: 30 });
  });

  it('returns null when assessmentStatus is absent (live response today)', () => {
    const record = { contentStatus: {} } as unknown as ViewerSummaryRecord;
    expect(getAssessmentScore('qs_outcome', record)).toBeNull();
    expect(getAssessmentScore(undefined, record)).toBeNull();
    expect(getAssessmentScore('qs_outcome', undefined)).toBeNull();
  });
});

describe('getResumeTarget', () => {
  const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

  it('prefers the path record lastReadContentId when it maps to a known course', () => {
    const records = normaliseSummaryRecords(PARTIAL_RESPONSE);
    const pathSummary = getPathSummary(records, model.identifier);

    const target = getResumeTarget(model, pathSummary);
    expect(target).toEqual({
      collectionId: 'do_2146316303263006721126',
      contentId: 'do_214631592231313408130',
      contextId: '0146338062206566400:do_2146316303263006721126',
    });
  });

  it('falls back to the first incomplete leaf in document order when lastReadContentId is absent', () => {
    const noLastRead: ViewerSummaryListResponse = {
      response: [
        {
          batchId: '0146338062206566400',
          userId: 'user-1',
          contentStatus: { do_21463158442296934411: 2 },
          completionPercentage: 33,
          progress: 1,
          lastReadContentId: null,
          courseId: model.identifier,
          status: 1,
          active: true,
        } as unknown as ViewerSummaryRecord,
      ],
    };
    const records = normaliseSummaryRecords(noLastRead);
    const pathSummary = getPathSummary(records, model.identifier);

    const target = getResumeTarget(model, pathSummary);
    expect(target).toEqual({
      collectionId: 'do_2146316303263006721126',
      contentId: 'do_214631592231313408130',
      contextId: '0146338062206566400:do_2146316303263006721126',
    });
  });

  it('returns null for a not-enrolled user (no path summary)', () => {
    expect(getResumeTarget(model, undefined)).toBeNull();
  });

  it('returns null once the whole path is complete', () => {
    const records = normaliseSummaryRecords(ALL_DONE_RESPONSE);
    const pathSummary = getPathSummary(records, model.identifier);
    // lastReadContentId maps to a known course, so this exercises the "found but nothing left" tail too:
    // remove it to force the fallback scan, which should find no incomplete leaf.
    const noLastRead = { ...pathSummary, lastReadContentId: null } as typeof pathSummary;
    expect(getResumeTarget(model, noLastRead)).toBeNull();
  });

  // Regression: with duplicate LP enrolments, the resume target's contextId
  // must be the per-course fan-out record's own contextId, not a blindly
  // constructed `<lpContextId>:<courseId>` that may have no enrolment record.
  it('resolves the resume target contextId from the fan-out record when duplicate enrolments exist', () => {
    const records = normaliseSummaryRecords(PARTIAL_RESPONSE);
    const pathSummary = getPathSummary(records, model.identifier);
    // Replace the course's own fan-out record (batch matches pathSummary's
    // contextId) with one under a DIFFERENT batch - the situation observed
    // live, where the LP is enrolled twice and only one batch got fanned out.
    const recordsWithRelocatedFanOut = records
      .filter((r) => r.collectionId !== 'do_2146316303263006721126')
      .concat({
        collectionId: 'do_2146316303263006721126',
        contextId: 'OTHER_BATCH:do_2146316303263006721126',
        active: true,
        status: 1,
        progress: 1,
        contentStatus: {},
      } as unknown as ViewerSummaryRecord);

    const target = getResumeTarget(model, pathSummary, recordsWithRelocatedFanOut);
    expect(target).toEqual({
      collectionId: 'do_2146316303263006721126',
      contentId: 'do_214631592231313408130',
      contextId: 'OTHER_BATCH:do_2146316303263006721126',
    });
  });

  it('targets the prior assessment first when it exists and is incomplete', () => {
    const withAssessModel = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);
    const pathSummary = {
      contextId: 'batch-full',
      contentStatus: {},
      lastReadContentId: null,
    } as unknown as ViewerSummaryRecord;

    const target = getResumeTarget(withAssessModel, pathSummary);
    expect(target).toEqual({
      collectionId: 'course_prior',
      contentId: 'qs_prior',
      contextId: 'batch-full:course_prior',
    });
  });
});
