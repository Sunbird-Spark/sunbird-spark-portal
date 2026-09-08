import { describe, it, expect } from 'vitest';
import { normalisePassbook, isHeld, primaryFrameworkId, humaniseCode } from './passbookMapper';
import { PASSBOOK_STATUS, type PassbookEntry } from '../../types/competencyServiceTypes';

const entry = (over: Partial<PassbookEntry> = {}): PassbookEntry => ({
  competencyId: 'medication-administration',
  frameworkId: 'fw_health_competency2',
  level: 'l4',
  levelIndex: 4,
  status: PASSBOOK_STATUS.attained,
  sourceType: 'ASSESSMENT',
  evidence: [],
  ...over,
});

describe('normalisePassbook', () => {
  it('maps the live wire shape', () => {
    const out = normalisePassbook({
      result: {
        competencies: [
          {
            competencyId: 'medication-administration',
            frameworkId: 'fw_health_competency2',
            level: 'l4',
            levelIndex: 4,
            status: 'ATTAINED',
            sourceType: 'ASSESSMENT',
            attainedOn: '2026-09-08T07:20:02.000Z',
          },
        ],
      },
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.competencyId).toBe('medication-administration');
    expect(out[0]!.levelIndex).toBe(4);
    expect(out[0]!.attainedOn).toBe(Date.parse('2026-09-08T07:20:02.000Z'));
  });

  it('drops entries with no competencyId - nothing to label or match', () => {
    const out = normalisePassbook({
      result: { competencies: [{ level: 'l3' }, { competencyId: 'team-leadership' }] },
    });
    expect(out.map((e) => e.competencyId)).toEqual(['team-leadership']);
  });

  // The real-world shape: the ledger writes a NEW evidenceId per re-projection
  // (occurredOn is part of the id), so 12 rows described one course completion and
  // rendered as twelve identical "Course - 08 Sept 2026" lines.
  it('collapses many stored rows describing ONE fact into a single row', () => {
    const dup = (n: number) => ({
      evidenceId: `000000178885200${n}:3050`,
      sourceType: 'COURSE',
      sourceId: 'do_course_1',
      level: 'l2',
    });
    const out = normalisePassbook({
      competencies: [
        {
          competencyId: 'neonatal-resuscitation',
          evidence: [dup(1), dup(2), dup(3), dup(4), dup(5)],
        },
      ],
    });
    expect(out[0]!.evidence).toHaveLength(1);
    expect(out[0]!.evidence[0]!.sourceType).toBe('COURSE');
  });

  it('keeps genuinely different evidence apart - two attempts, different scores', () => {
    const out = normalisePassbook({
      competencies: [
        {
          competencyId: 'c1',
          evidence: [
            { evidenceId: 'a', sourceType: 'ASSESSMENT', sourceId: 'qs1', level: 'l3', score: 1, maxScore: 1 },
            { evidenceId: 'b', sourceType: 'ASSESSMENT', sourceId: 'qs1', level: 'l3', score: 0, maxScore: 1 },
          ],
        },
      ],
    });
    expect(out[0]!.evidence).toHaveLength(2);
  });

  it('keeps COURSE and ASSESSMENT evidence for the same competency apart', () => {
    const out = normalisePassbook({
      competencies: [
        {
          competencyId: 'c1',
          evidence: [
            { evidenceId: 'a', sourceType: 'COURSE', sourceId: 'crs', level: 'l2' },
            { evidenceId: 'b', sourceType: 'ASSESSMENT', sourceId: 'qs1', level: 'l2', score: 0, maxScore: 1 },
          ],
        },
      ],
    });
    expect(out[0]!.evidence.map((e) => e.sourceType)).toEqual(['COURSE', 'ASSESSMENT']);
  });

  it('deduplicates evidence on evidenceId', () => {
    const out = normalisePassbook({
      result: {
        competencies: [
          {
            competencyId: 'c1',
            evidence: [
              { evidenceId: 'e1', sourceType: 'ASSESSMENT', score: 1, maxScore: 1 },
              { evidenceId: 'e1', sourceType: 'ASSESSMENT', score: 1, maxScore: 1 },
              { evidenceId: 'e2', sourceType: 'COURSE' },
            ],
          },
        ],
      },
    });
    expect(out[0]!.evidence.map((e) => e.evidenceId)).toEqual(['e1', 'e2']);
  });

  it('drops evidence with no evidenceId and tolerates absent scores', () => {
    const out = normalisePassbook({
      result: { competencies: [{ competencyId: 'c1', evidence: [{ sourceType: 'COURSE' }, { evidenceId: 'e1' }] }] },
    });
    expect(out[0]!.evidence).toHaveLength(1);
    expect(out[0]!.evidence[0]!.score).toBeUndefined();
  });

  it('defaults a missing status to IN_PROGRESS rather than claiming attainment', () => {
    const out = normalisePassbook({ result: { competencies: [{ competencyId: 'c1' }] } });
    expect(out[0]!.status).toBe(PASSBOOK_STATUS.inProgress);
  });

  it('ignores an unparseable date instead of emitting NaN', () => {
    const out = normalisePassbook({ result: { competencies: [{ competencyId: 'c1', attainedOn: 'not-a-date' }] } });
    expect(out[0]!.attainedOn).toBeUndefined();
  });

  // The live shape. AxiosAdapter.mapResponse unwraps `result` before a mapper
  // sees it, so this - not the enveloped form - is what actually arrives.
  // Reading `result.competencies` rendered an empty passbook against a good 200.
  it('reads the UNWRAPPED shape the http adapter delivers', () => {
    const out = normalisePassbook({
      count: 5,
      competencies: [{ competencyId: 'medication-administration', level: 'l4', levelIndex: 4, status: 'ATTAINED' }],
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.competencyId).toBe('medication-administration');
  });

  it.each([undefined, null, {}, { result: {} }])('returns [] for %s', (input) => {
    expect(normalisePassbook(input as never)).toEqual([]);
  });
});

describe('isHeld', () => {
  it('counts ATTAINED and EXPIRING as held, not IN_PROGRESS or EXPIRED', () => {
    expect(isHeld(entry({ status: PASSBOOK_STATUS.attained }))).toBe(true);
    // still valid, just due for revalidation
    expect(isHeld(entry({ status: PASSBOOK_STATUS.expiring }))).toBe(true);
    expect(isHeld(entry({ status: PASSBOOK_STATUS.inProgress }))).toBe(false);
    expect(isHeld(entry({ status: PASSBOOK_STATUS.expired }))).toBe(false);
  });
});

describe('primaryFrameworkId', () => {
  it('takes the first entry that names a framework', () => {
    expect(primaryFrameworkId([entry({ frameworkId: '' }), entry({ frameworkId: 'fw_b' })])).toBe('fw_b');
  });

  it('is undefined when no entry names one', () => {
    expect(primaryFrameworkId([entry({ frameworkId: '' })])).toBeUndefined();
    expect(primaryFrameworkId([])).toBeUndefined();
  });
});

describe('humaniseCode', () => {
  it.each([
    ['medication-administration', 'Medication administration'],
    ['health_data_and_reporting', 'Health data and reporting'],
    ['l3practitioner', 'L3practitioner'],
  ])('turns %s into %s', (code, expected) => {
    expect(humaniseCode(code)).toBe(expected);
  });

  it('returns the input for an empty or separator-only code', () => {
    expect(humaniseCode('')).toBe('');
    expect(humaniseCode('--')).toBe('--');
  });
});
