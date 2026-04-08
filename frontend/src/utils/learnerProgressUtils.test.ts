import { describe, it, expect } from 'vitest';
import { buildEnrollmentVsCompletion, buildProgressBuckets, buildScoreDistribution, mapApiItemToAssessmentRecord, mapApiItemToLearnerProgress } from './learnerProgressUtils';
import type { AssessmentApiItem, LearnerProgressApiItem } from '@/types/reports';

const makeItem = (overrides: Partial<LearnerProgressApiItem>): LearnerProgressApiItem => ({
  userid: 'u-1',
  userDetails: { firstName: 'Test', lastName: 'User' },
  enrolled_date: '2026-03-04T08:00:00.000+00:00',
  completionpercentage: null,
  status: 1,
  datetime: '2026-03-04T08:00:00.000+00:00',
  issued_certificates: null,
  ...overrides,
});

describe('buildEnrollmentVsCompletion', () => {
  it('returns empty array when batchStartDate is undefined', () => {
    const learners = [makeItem({})];
    expect(buildEnrollmentVsCompletion(learners, undefined)).toEqual([]);
  });

  it('returns 4 week buckets when batchStartDate is provided', () => {
    const result = buildEnrollmentVsCompletion([], '2026-03-04');
    expect(result).toHaveLength(4);
    expect(result[0]!.label).toBe('Week 1');
    expect(result[3]!.label).toBe('Week 4');
  });

  it('places learner in correct week by enrolled_date', () => {
    const learners = [
      makeItem({ enrolled_date: '2026-03-04T08:00:00.000+00:00' }), // day 0 → Week 1
      makeItem({ enrolled_date: '2026-03-11T08:00:00.000+00:00' }), // day 7 → Week 2
      makeItem({ enrolled_date: '2026-03-18T08:00:00.000+00:00' }), // day 14 → Week 3
    ];
    const result = buildEnrollmentVsCompletion(learners, '2026-03-04');
    expect(result[0]!.enrolled).toBe(1);
    expect(result[1]!.enrolled).toBe(1);
    expect(result[2]!.enrolled).toBe(1);
    expect(result[3]!.enrolled).toBe(0);
  });

  it('counts completed learners (status=2) by datetime in correct week', () => {
    const learners = [
      makeItem({ status: 2, datetime: '2026-03-05T08:00:00.000+00:00' }), // day 1 → Week 1
      makeItem({ status: 1, datetime: '2026-03-05T08:00:00.000+00:00' }), // not completed → ignored
    ];
    const result = buildEnrollmentVsCompletion(learners, '2026-03-04');
    expect(result[0]!.completed).toBe(1);
    expect(result[1]!.completed).toBe(0);
  });

  it('ignores learners enrolled before batch start date', () => {
    const learners = [
      makeItem({ enrolled_date: '2026-03-01T08:00:00.000+00:00' }), // before start
    ];
    const result = buildEnrollmentVsCompletion(learners, '2026-03-04');
    expect(result.every((w) => w.enrolled === 0)).toBe(true);
  });

  it('ignores learners enrolled after week 4', () => {
    const learners = [
      makeItem({ enrolled_date: '2026-04-10T08:00:00.000+00:00' }), // week 5+
    ];
    const result = buildEnrollmentVsCompletion(learners, '2026-03-04');
    expect(result.every((w) => w.enrolled === 0)).toBe(true);
  });

  it('all buckets start at zero when learner list is empty', () => {
    const result = buildEnrollmentVsCompletion([], '2026-03-04');
    for (const bucket of result) {
      expect(bucket.enrolled).toBe(0);
      expect(bucket.completed).toBe(0);
    }
  });
});

describe('buildProgressBuckets', () => {
  it('returns 4 buckets with zero counts for empty learner list', () => {
    const result = buildProgressBuckets([]);
    expect(result).toHaveLength(4);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it('bucket labels are 0–25%, 25–50%, 50–75%, 75–100%', () => {
    const labels = buildProgressBuckets([]).map((b) => b.bucket);
    expect(labels).toEqual(['0–25%', '25–50%', '50–75%', '75–100%']);
  });

  it('maps null completionpercentage to 0 (placed in 0–25% bucket)', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: null })]);
    expect(result[0]!.count).toBe(1);
  });

  it('places exactly 0 in 0–25% bucket', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 0 })]);
    expect(result[0]!.count).toBe(1);
  });

  it('places 25 in 0–25% bucket (inclusive upper boundary)', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 25 })]);
    expect(result[0]!.count).toBe(1);
  });

  it('places 26 in 25–50% bucket', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 26 })]);
    expect(result[1]!.count).toBe(1);
  });

  it('places 50 in 25–50% bucket (inclusive upper boundary)', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 50 })]);
    expect(result[1]!.count).toBe(1);
  });

  it('places 51 in 50–75% bucket', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 51 })]);
    expect(result[2]!.count).toBe(1);
  });

  it('places 75 in 50–75% bucket (inclusive upper boundary)', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 75 })]);
    expect(result[2]!.count).toBe(1);
  });

  it('places 100 in 75–100% bucket', () => {
    const result = buildProgressBuckets([makeItem({ completionpercentage: 100 })]);
    expect(result[3]!.count).toBe(1);
  });

  it('distributes multiple learners across correct buckets', () => {
    const learners = [
      makeItem({ completionpercentage: 10 }),  // bucket 0
      makeItem({ completionpercentage: 10 }),  // bucket 0
      makeItem({ completionpercentage: 40 }),  // bucket 1
      makeItem({ completionpercentage: 60 }),  // bucket 2
      makeItem({ completionpercentage: 90 }),  // bucket 3
      makeItem({ completionpercentage: 100 }), // bucket 3
    ];
    const result = buildProgressBuckets(learners);
    expect(result[0]!.count).toBe(2);
    expect(result[1]!.count).toBe(1);
    expect(result[2]!.count).toBe(1);
    expect(result[3]!.count).toBe(2);
  });
});

const makeAssessmentItem = (overrides: Partial<AssessmentApiItem> = {}): AssessmentApiItem => ({
  user_id: 'u-1',
  attempt_count: 1,
  total_score: 80,
  total_max_score: 100,
  userDetails: { firstName: 'Jane', lastName: 'Doe' },
  last_attempted_on: '2026-03-04T08:00:00.000+00:00',
  ...overrides,
});

describe('buildScoreDistribution', () => {
  it('places records in correct score buckets', () => {
    const records = [
      { id: '1', learnerName: 'A', attemptNumber: 1, score: 10, maxScore: 100, percentage: 10, attemptDate: '2024-01-01' },
      { id: '2', learnerName: 'B', attemptNumber: 1, score: 30, maxScore: 100, percentage: 30, attemptDate: '2024-01-01' },
      { id: '3', learnerName: 'C', attemptNumber: 1, score: 50, maxScore: 100, percentage: 50, attemptDate: '2024-01-01' },
      { id: '4', learnerName: 'D', attemptNumber: 1, score: 70, maxScore: 100, percentage: 70, attemptDate: '2024-01-01' },
      { id: '5', learnerName: 'E', attemptNumber: 1, score: 90, maxScore: 100, percentage: 90, attemptDate: '2024-01-01' },
    ];
    const result = buildScoreDistribution(records);
    expect(result).toHaveLength(5);
    expect(result[0]!.count).toBe(1); // ≤20
    expect(result[1]!.count).toBe(1); // ≤40
    expect(result[2]!.count).toBe(1); // ≤60
    expect(result[3]!.count).toBe(1); // ≤80
    expect(result[4]!.count).toBe(1); // >80
  });

  it('returns all zeros for empty records', () => {
    const result = buildScoreDistribution([]);
    expect(result.every(b => b.count === 0)).toBe(true);
  });
});

describe('mapApiItemToAssessmentRecord', () => {
  it('maps item with score and max score', () => {
    const item = makeAssessmentItem({ total_score: 80, total_max_score: 100 });
    const result = mapApiItemToAssessmentRecord(item);
    expect(result.score).toBe(80);
    expect(result.maxScore).toBe(100);
    expect(result.percentage).toBe(80);
  });

  it('returns 0 percentage when maxScore is 0', () => {
    const item = makeAssessmentItem({ total_score: 0, total_max_score: 0 });
    const result = mapApiItemToAssessmentRecord(item);
    expect(result.percentage).toBe(0);
  });

  it('returns 0 for null score/maxScore', () => {
    const item = makeAssessmentItem({ total_score: null, total_max_score: null });
    const result = mapApiItemToAssessmentRecord(item);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
  });

  it('constructs learnerName from firstName and lastName', () => {
    const item = makeAssessmentItem({ userDetails: { firstName: 'Alice', lastName: 'Smith' } });
    expect(mapApiItemToAssessmentRecord(item).learnerName).toBe('Alice Smith');
  });

  it('handles missing lastName', () => {
    const item = makeAssessmentItem({ userDetails: { firstName: 'Alice' } });
    expect(mapApiItemToAssessmentRecord(item).learnerName).toBe('Alice');
  });
});

describe('mapApiItemToLearnerProgress', () => {
  it('handles missing lastName gracefully', () => {
    const item = makeItem({ userDetails: { firstName: 'user13' } });
    const result = mapApiItemToLearnerProgress(item);
    expect(result.learnerName).toBe('user13');
  });

  it('maps status 0 to Not Started', () => {
    expect(mapApiItemToLearnerProgress(makeItem({ status: 0 })).status).toBe('Not Started');
  });

  it('maps status 1 to In Progress', () => {
    expect(mapApiItemToLearnerProgress(makeItem({ status: 1 })).status).toBe('In Progress');
  });

  it('maps status 2 to Completed', () => {
    expect(mapApiItemToLearnerProgress(makeItem({ status: 2 })).status).toBe('Completed');
  });

  it('maps null completionpercentage to 0', () => {
    expect(mapApiItemToLearnerProgress(makeItem({ completionpercentage: null })).progressPercent).toBe(0);
  });

  it('returns Issued when issued_certificates is not null', () => {
    const item = makeItem({
      issued_certificates: [{ identifier: '1', lastIssuedOn: '', name: '', templateUrl: '', token: '', type: '' }],
    });
    expect(mapApiItemToLearnerProgress(item).certificateStatus).toBe('Issued');
  });

  it('returns Pending when completed (status=2) but no certificate', () => {
    expect(mapApiItemToLearnerProgress(makeItem({ status: 2, issued_certificates: null })).certificateStatus).toBe('Pending');
  });

  it('returns N/A when not completed and no certificate', () => {
    expect(mapApiItemToLearnerProgress(makeItem({ status: 1, issued_certificates: null })).certificateStatus).toBe('N/A');
  });

  it('extracts date-only from ISO datetime strings', () => {
    const item = makeItem({
      enrolled_date: '2026-03-04T14:14:46.351+00:00',
      datetime: '2026-03-06T06:46:26.055+00:00',
    });
    const result = mapApiItemToLearnerProgress(item);
    expect(result.enrollmentDate).toBe('2026-03-04');
    // lastActiveDate is now relative time, not a raw date
    expect(result.lastActiveDate).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.lastActiveDate).toMatch(/ago|seconds/);
  });
});
