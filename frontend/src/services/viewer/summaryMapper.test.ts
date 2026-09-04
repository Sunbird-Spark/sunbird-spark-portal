import { describe, it, expect } from 'vitest';
import {
  normaliseSummaryRecords,
  normaliseSummaryReadRecord,
  indexSummaryByCollectionId,
  buildCourseSummaryMapForContext,
  getPathSummary,
  buildCourseContextId,
  getCourseContextId,
  parseCourseContextId,
  getOptionalNodeIds,
} from './summaryMapper';
import type { ViewerSummaryListResponse, ViewerSummaryRecord } from '../../types/viewerServiceTypes';

// Real /v1/summary/list/{userId} response (live wire shape: `response[]`, `courseId`/`batchId`).
const LIVE_RESPONSE: ViewerSummaryListResponse = {
  response: [
    {
      dateTime: '2026-08-10T09:52:15.838+00:00',
      lastReadContentStatus: null,
      enrolledDate: '2026-08-10T09:52:15.838+00:00',
      addedBy: 'system',
      active: true,
      batchId: '0146338062206566400:do_214631618315042816133',
      userId: 'b8bc0092-2dbc-457b-8fc4-100664df1bb9',
      contentStatus: { do_214631615408873472110: 2 },
      completionPercentage: 100,
      issuedCertificates: [],
      completedOn: '2026-08-10T09:52:46.536+00:00',
      progress: 1,
      lastReadContentId: null,
      courseId: 'do_214631618315042816133',
      status: 2,
    } as unknown as ViewerSummaryRecord,
    {
      dateTime: '2026-08-10T09:20:29.319+00:00',
      lastReadContentStatus: 2,
      enrolledDate: '2026-08-10T09:20:29.319+00:00',
      addedBy: 'system',
      active: true,
      batchId: '0146338062206566400:do_2146316303263006721126',
      userId: 'b8bc0092-2dbc-457b-8fc4-100664df1bb9',
      contentStatus: { do_21463158442296934411: 2, do_214631592231313408130: 2 },
      completionPercentage: 100,
      issuedCertificates: [],
      completedOn: '2026-08-10T09:52:15.815+00:00',
      progress: 2,
      lastReadContentId: 'do_214631592231313408130',
      courseId: 'do_2146316303263006721126',
      status: 2,
    } as unknown as ViewerSummaryRecord,
    {
      dateTime: '2026-08-10T09:20:28.825+00:00',
      lastReadContentStatus: 2,
      enrolledDate: '2026-08-10T09:20:28.825+00:00',
      addedBy: '51d5977e-e2f5-4e8b-a52d-c1ab34d417d8',
      active: true,
      batchId: '0146338062206566400',
      userId: 'b8bc0092-2dbc-457b-8fc4-100664df1bb9',
      contentStatus: {
        do_21463158442296934411: 2,
        do_214631592231313408130: 2,
        do_214631615408873472110: 2,
      },
      completionPercentage: 100,
      issuedCertificates: [],
      completedOn: '2026-08-10T09:52:46.550+00:00',
      progress: 3,
      lastReadContentId: 'do_214631615408873472110',
      courseId: 'do_2146317230884208641312',
      status: 2,
    } as unknown as ViewerSummaryRecord,
  ],
};

// Spec-shaped response (`summary[]`, `collectionId`/`contextId`, `assessmentStatus`).
const SPEC_RESPONSE: ViewerSummaryListResponse = {
  summary: [
    {
      userId: 'u1',
      collectionId: 'do_lp',
      contextId: 'batch-1',
      active: true,
      status: 1,
      progress: 1,
      contentStatus: { do_a: 1 },
      assessmentStatus: { do_assess: { score: 8, max_score: 10 } },
    },
  ],
};

describe('normaliseSummaryRecords', () => {
  it('normalises the live shape (response[] with courseId/batchId) into collectionId/contextId', () => {
    const records = normaliseSummaryRecords(LIVE_RESPONSE);

    expect(records).toHaveLength(3);
    expect(records[0]!.collectionId).toBe('do_214631618315042816133');
    expect(records[0]!.contextId).toBe('0146338062206566400:do_214631618315042816133');
    expect(records[2]!.collectionId).toBe('do_2146317230884208641312');
    expect(records[2]!.contextId).toBe('0146338062206566400');
  });

  it('normalises the spec shape (summary[] with collectionId/contextId) unchanged', () => {
    const records = normaliseSummaryRecords(SPEC_RESPONSE);

    expect(records).toHaveLength(1);
    expect(records[0]!.collectionId).toBe('do_lp');
    expect(records[0]!.contextId).toBe('batch-1');
    expect(records[0]!.assessmentStatus).toEqual({ do_assess: { score: 8, max_score: 10 } });
  });

  it('returns an empty array for a null/undefined/empty response', () => {
    expect(normaliseSummaryRecords(null)).toEqual([]);
    expect(normaliseSummaryRecords(undefined)).toEqual([]);
    expect(normaliseSummaryRecords({})).toEqual([]);
  });

  // The sample /v1/summary/read response returns optional_nodes: [] today - this
  // must be a strict no-op for every existing caller.
  it('defaults optionalNodes to an empty array when the field is absent', () => {
    const records = normaliseSummaryRecords(LIVE_RESPONSE);
    expect(records[0]!.optionalNodes).toEqual([]);
  });

  it('normalises the live snake_case optional_nodes field into optionalNodes', () => {
    const res: ViewerSummaryListResponse = {
      response: [{ ...LIVE_RESPONSE.response![0]!, optional_nodes: ['do_leaf_1', 'do_course_2'] }],
    };
    const records = normaliseSummaryRecords(res);
    expect(records[0]!.optionalNodes).toEqual(['do_leaf_1', 'do_course_2']);
  });

  it('prefers an already-normalised optionalNodes field over optional_nodes when both are present', () => {
    const res: ViewerSummaryListResponse = {
      response: [
        { ...LIVE_RESPONSE.response![0]!, optionalNodes: ['do_a'], optional_nodes: ['do_b'] },
      ],
    };
    const records = normaliseSummaryRecords(res);
    expect(records[0]!.optionalNodes).toEqual(['do_a']);
  });
});

describe('normaliseSummaryReadRecord', () => {
  it('normalises the live shape and defaults optionalNodes to an empty array when absent', () => {
    const record = normaliseSummaryReadRecord({ response: LIVE_RESPONSE.response![0]! });
    expect(record?.collectionId).toBe('do_214631618315042816133');
    expect(record?.optionalNodes).toEqual([]);
  });

  it('normalises the live snake_case optional_nodes field into optionalNodes', () => {
    const record = normaliseSummaryReadRecord({
      response: { ...LIVE_RESPONSE.response![0]!, optional_nodes: ['do_leaf_1'] },
    });
    expect(record?.optionalNodes).toEqual(['do_leaf_1']);
  });

  it('normalises the spec shape unchanged', () => {
    const record = normaliseSummaryReadRecord({ summary: SPEC_RESPONSE.summary![0]! });
    expect(record?.collectionId).toBe('do_lp');
  });

  it('returns undefined for a null/undefined/empty response', () => {
    expect(normaliseSummaryReadRecord(null)).toBeUndefined();
    expect(normaliseSummaryReadRecord(undefined)).toBeUndefined();
    expect(normaliseSummaryReadRecord({})).toBeUndefined();
  });
});

describe('getOptionalNodeIds', () => {
  it('returns an empty set when the path record has no optional_nodes', () => {
    expect(getOptionalNodeIds(undefined)).toEqual(new Set());
    expect(getOptionalNodeIds({ ...LIVE_RESPONSE.response![0]!, optionalNodes: [] })).toEqual(new Set());
  });

  it("unions the path record's own optional_nodes with every course record's", () => {
    const pathSummary: ViewerSummaryRecord = { ...LIVE_RESPONSE.response![0]!, optionalNodes: ['do_a'] };
    const courseRecords = new Map<string, ViewerSummaryRecord>([
      ['course_1', { ...LIVE_RESPONSE.response![0]!, optionalNodes: ['do_b'] }],
      ['course_2', { ...LIVE_RESPONSE.response![0]!, optionalNodes: ['do_a', 'do_c'] }],
    ]);
    expect(getOptionalNodeIds(pathSummary, courseRecords)).toEqual(new Set(['do_a', 'do_b', 'do_c']));
  });

  it('works with only the path record (no course map)', () => {
    const pathSummary: ViewerSummaryRecord = { ...LIVE_RESPONSE.response![0]!, optionalNodes: ['do_a'] };
    expect(getOptionalNodeIds(pathSummary)).toEqual(new Set(['do_a']));
  });
});

describe('indexSummaryByCollectionId / getPathSummary', () => {
  it('indexes normalised records by collectionId', () => {
    const records = normaliseSummaryRecords(LIVE_RESPONSE);
    const index = indexSummaryByCollectionId(records);

    expect(index.get('do_214631618315042816133')?.contentStatus).toEqual({
      do_214631615408873472110: 2,
    });
    expect(index.size).toBe(3);
  });

  it('finds the path-root record by pathId', () => {
    const records = normaliseSummaryRecords(LIVE_RESPONSE);
    const pathSummary = getPathSummary(records, 'do_2146317230884208641312');

    expect(pathSummary).toBeDefined();
    expect(pathSummary?.progress).toBe(3);
    expect(pathSummary?.contentStatus).toEqual({
      do_21463158442296934411: 2,
      do_214631592231313408130: 2,
      do_214631615408873472110: 2,
    });
  });

  it('returns undefined when pathId is missing or has no matching record', () => {
    const records = normaliseSummaryRecords(LIVE_RESPONSE);
    expect(getPathSummary(records, undefined)).toBeUndefined();
    expect(getPathSummary(records, 'do_unknown')).toBeUndefined();
  });
});

// Real live data (do_214635111292362752115): a user enrolled in the same
// Learning Path under TWO batches. Only one of those batches actually got
// fanned out into per-course enrolment records.
const DUPLICATE_ENROLMENT_RECORDS: ViewerSummaryRecord[] = [
  // Fan-out record for the inner course — enrolled under the SECOND LP batch.
  {
    userId: 'u1',
    courseId: 'do_2146346368663224321166',
    batchId: '0146351615020892160:do_2146346368663224321166',
    active: true,
    status: 0,
    progress: 0,
    contentStatus: {},
    enrolledDate: '2026-08-12T06:50:00.000+00:00',
  } as unknown as ViewerSummaryRecord,
  // LP enrolment #1 (first/older) - no fan-out record uses this batch.
  {
    userId: 'u1',
    courseId: 'do_214635111292362752115',
    batchId: '0146351570062376960',
    active: true,
    status: 0,
    progress: 0,
    contentStatus: {},
    enrolledDate: '2026-08-12T06:00:00.000+00:00',
  } as unknown as ViewerSummaryRecord,
  // LP enrolment #2 (later) - matches the fan-out record's batch prefix.
  {
    userId: 'u1',
    courseId: 'do_214635111292362752115',
    batchId: '0146351615020892160',
    active: true,
    status: 0,
    progress: 0,
    contentStatus: {},
    enrolledDate: '2026-08-12T06:49:00.000+00:00',
  } as unknown as ViewerSummaryRecord,
].map((r) => ({ ...r, collectionId: r.courseId, contextId: r.batchId }));

describe('getPathSummary — duplicate Learning Path enrolments (regression)', () => {
  it('prefers the LP record whose contextId is the prefix of an existing fan-out record', () => {
    const pathSummary = getPathSummary(DUPLICATE_ENROLMENT_RECORDS, 'do_214635111292362752115');
    expect(pathSummary?.contextId).toBe('0146351615020892160');
  });

  it('prefers an exact match on the given preferredContextId over the fan-out heuristic', () => {
    const pathSummary = getPathSummary(
      DUPLICATE_ENROLMENT_RECORDS,
      'do_214635111292362752115',
      '0146351570062376960'
    );
    expect(pathSummary?.contextId).toBe('0146351570062376960');
  });

  it('falls back to the most recently enrolled record when no fan-out record exists for any candidate', () => {
    const noFanOut = DUPLICATE_ENROLMENT_RECORDS.filter((r) => r.collectionId !== 'do_2146346368663224321166');
    const pathSummary = getPathSummary(noFanOut, 'do_214635111292362752115');
    expect(pathSummary?.contextId).toBe('0146351615020892160');
  });

  it('returns the single match unchanged when there is no duplicate enrolment', () => {
    const records = normaliseSummaryRecords(LIVE_RESPONSE);
    expect(getPathSummary(records, 'do_2146317230884208641312')?.contextId).toBe('0146338062206566400');
  });
});

describe('buildCourseSummaryMapForContext', () => {
  // A course id that has a completed record from an UNRELATED context (a
  // different Learning Path/standalone enrolment), plus its real fan-out
  // record under `lpContextId`.
  const records: ViewerSummaryRecord[] = [
    {
      collectionId: 'do_course_shared',
      contextId: 'other-lp-batch:do_course_shared',
      completionPercentage: 100,
      contentStatus: { do_leaf1: 2 },
    } as unknown as ViewerSummaryRecord,
    {
      collectionId: 'do_course_shared',
      contextId: 'this-lp-batch:do_course_shared',
      completionPercentage: 40,
      contentStatus: { do_leaf1: 1 },
    } as unknown as ViewerSummaryRecord,
  ];

  it('returns an empty map when lpContextId is undefined (not enrolled in this path)', () => {
    const map = buildCourseSummaryMapForContext(records, undefined);
    expect(map.size).toBe(0);
  });

  it('excludes a same-collectionId record from a foreign context (the leak this fixes)', () => {
    const map = buildCourseSummaryMapForContext(records, 'this-lp-batch');
    expect(map.get('do_course_shared')?.completionPercentage).toBe(40);
    expect(map.size).toBe(1);
  });

  it('only includes records whose contextId is a fan-out of the given lpContextId', () => {
    const map = buildCourseSummaryMapForContext(records, 'unrelated-batch');
    expect(map.size).toBe(0);
  });
});

describe('getCourseContextId', () => {
  it('uses the fan-out record\'s own contextId instead of constructing one (the bug this fixes)', () => {
    const contextId = getCourseContextId(
      DUPLICATE_ENROLMENT_RECORDS,
      '0146351570062376960', // the (wrong) LP batch a naive resolver might pick
      'do_2146346368663224321166'
    );
    expect(contextId).toBe('0146351615020892160:do_2146346368663224321166');
    // Explicitly NOT the blindly-constructed composite:
    expect(contextId).not.toBe('0146351570062376960:do_2146346368663224321166');
  });

  it('prefers a fan-out record whose prefix matches the given lpContextId when several exist', () => {
    const both = [
      ...DUPLICATE_ENROLMENT_RECORDS,
      {
        userId: 'u1',
        collectionId: 'do_2146346368663224321166',
        contextId: '0146351570062376960:do_2146346368663224321166',
        active: true,
        status: 0,
        progress: 0,
        contentStatus: {},
      } as unknown as ViewerSummaryRecord,
    ];
    const contextId = getCourseContextId(both, '0146351570062376960', 'do_2146346368663224321166');
    expect(contextId).toBe('0146351570062376960:do_2146346368663224321166');
  });

  it('falls back to constructing the composite when no fan-out record exists yet', () => {
    const contextId = getCourseContextId([], 'lpbatch', 'do_course');
    expect(contextId).toBe('lpbatch:do_course');
  });
});

describe('buildCourseContextId / parseCourseContextId', () => {
  it('builds and round-trips a composite context id', () => {
    const composite = buildCourseContextId('0146338062206566400', 'do_214631618315042816133');
    expect(composite).toBe('0146338062206566400:do_214631618315042816133');

    const parsed = parseCourseContextId(composite);
    expect(parsed).toEqual({
      lpContextId: '0146338062206566400',
      courseId: 'do_214631618315042816133',
    });
  });

  it('returns null for a plain (non-composite) context id', () => {
    expect(parseCourseContextId('0146338062206566400')).toBeNull();
  });

  it('returns null for empty/undefined input', () => {
    expect(parseCourseContextId(undefined)).toBeNull();
    expect(parseCourseContextId(null)).toBeNull();
    expect(parseCourseContextId('')).toBeNull();
  });
});
