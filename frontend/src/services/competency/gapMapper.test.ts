import { describe, it, expect } from 'vitest';
import { normaliseGap, sortGapRows, normaliseFrameworkMeta, levelLabel, topLevelIndex } from './gapMapper';
import { GAP_STATUS, type GapRow } from '../../types/competencyServiceTypes';

const row = (over: Partial<GapRow> = {}): GapRow => ({
  competencyId: 'c1',
  requiredLevel: 'l3',
  requiredLevelIndex: 3,
  heldLevel: 'l4',
  heldLevelIndex: 4,
  criticality: 'MANDATORY',
  status: GAP_STATUS.met,
  ...over,
});

describe('normaliseGap', () => {
  it('maps the live wire shape for a fully-ready learner', () => {
    const out = normaliseGap({
      result: {
        gap: [
          {
            competencyId: 'medication-administration',
            requiredLevel: 'l3',
            requiredLevelIndex: 3,
            heldLevel: 'l4',
            heldLevelIndex: 4,
            criticality: 'MANDATORY',
            status: 'MET',
          },
        ],
        readiness: 100,
        position: 'staff-nurse-icu',
        frameworkId: 'fw_health_competency2',
        mandatoryOutstanding: 0,
      },
    });
    expect(out.readiness).toBe(100);
    expect(out.position).toBe('staff-nurse-icu');
    expect(out.resolved).toBe(true);
    expect(out.rows).toHaveLength(1);
  });

  // The service answers `readiness: 0` when it cannot resolve a position. That
  // zero means "unknown", and showing it as a score would tell a fully
  // qualified learner they are 0% ready.
  it('marks an unresolved position so 0 is never rendered as a score', () => {
    const out = normaliseGap({ result: { gap: [], readiness: 0, position: '', frameworkId: '' } });
    expect(out.resolved).toBe(false);
    expect(out.readiness).toBe(0);
    expect(out.rows).toEqual([]);
  });

  it('keeps resolved=true for a genuine 0% against a real position', () => {
    const out = normaliseGap({
      result: { gap: [{ competencyId: 'c1', status: 'MISSING' }], readiness: 0, position: 'deputy-secretary-health' },
    });
    expect(out.resolved).toBe(true);
    expect(out.readiness).toBe(0);
  });

  it('drops rows with no competencyId and defaults a missing status to MISSING', () => {
    const out = normaliseGap({ result: { gap: [{ status: 'MET' }, { competencyId: 'c2' }], position: 'p' } });
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0]!.status).toBe(GAP_STATUS.missing);
  });

  it('reads the UNWRAPPED shape the http adapter delivers', () => {
    const out = normaliseGap({
      gap: [{ competencyId: 'c1', status: 'MET' }],
      readiness: 100,
      position: 'staff-nurse-icu',
      mandatoryOutstanding: 0,
    });
    expect(out.resolved).toBe(true);
    expect(out.readiness).toBe(100);
    expect(out.rows).toHaveLength(1);
  });

  it.each([undefined, null, {}])('returns an unresolved gap for %s', (input) => {
    const out = normaliseGap(input as never);
    expect(out.resolved).toBe(false);
    expect(out.rows).toEqual([]);
  });
});

describe('sortGapRows', () => {
  it('puts MISSING first, then BELOW, then MET - actionable rows on top', () => {
    const rows = [
      row({ competencyId: 'a', status: GAP_STATUS.met }),
      row({ competencyId: 'b', status: GAP_STATUS.missing }),
      row({ competencyId: 'c', status: GAP_STATUS.below }),
    ];
    expect(sortGapRows(rows).map((r) => r.competencyId)).toEqual(['b', 'c', 'a']);
  });

  it('breaks ties alphabetically and does not mutate the input', () => {
    const rows = [row({ competencyId: 'z', status: GAP_STATUS.met }), row({ competencyId: 'a', status: GAP_STATUS.met })];
    expect(sortGapRows(rows).map((r) => r.competencyId)).toEqual(['a', 'z']);
    expect(rows[0]!.competencyId).toBe('z');
  });
});

describe('normaliseFrameworkMeta', () => {
  const response = {
    result: {
      frameworkId: 'fw_health_competency2',
      levels: [
        { code: 'l3', index: 3 },
        { code: 'l1', index: 1 },
      ],
      requirements: {
        'staff-nurse-icu': [{ competencyId: 'c1', requiredLevel: 'l3' }],
        // a position whose requirement edges failed to author - everyone would
        // read as 100% ready for it, so it must not be selectable
        'empty-position': [],
      },
    },
  };

  it('lists only positions that declare requirements, sorted', () => {
    const meta = normaliseFrameworkMeta(response);
    expect(meta?.positions).toEqual(['staff-nurse-icu']);
  });

  it('sorts levels by index', () => {
    expect(normaliseFrameworkMeta(response)?.levels.map((l) => l.code)).toEqual(['l1', 'l3']);
  });

  it('reads the UNWRAPPED framework shape too', () => {
    const meta = normaliseFrameworkMeta({
      frameworkId: 'fw_health_competency2',
      levels: [{ code: 'l1', index: 1 }],
      requirements: { 'staff-nurse-icu': [{ competencyId: 'c1' }] },
    });
    expect(meta?.frameworkId).toBe('fw_health_competency2');
    expect(meta?.positions).toEqual(['staff-nurse-icu']);
  });

  it('is undefined without a frameworkId, so callers can tell it did not resolve', () => {
    expect(normaliseFrameworkMeta({ result: {} })).toBeUndefined();
    expect(normaliseFrameworkMeta(undefined)).toBeUndefined();
  });
});

describe('levelLabel / topLevelIndex', () => {
  const meta = normaliseFrameworkMeta({
    result: { frameworkId: 'fw', levels: [{ code: 'l1', index: 1 }, { code: 'l4', index: 4 }], requirements: {} },
  });

  it('falls back to the code when the scale has no entry', () => {
    expect(levelLabel(meta, 'l9')).toBe('l9');
    expect(levelLabel(undefined, 'l1')).toBe('l1');
    expect(levelLabel(meta, '')).toBe('');
  });

  it('reports the top index, and 0 when the framework did not resolve', () => {
    expect(topLevelIndex(meta)).toBe(4);
    expect(topLevelIndex(undefined)).toBe(0);
  });
});
