import { describe, it, expect } from 'vitest';
import { normalizeQumlPlayerEvent } from './playerEventNormalizer';

describe('normalizeQumlPlayerEvent', () => {
  it('returns non-object input unchanged', () => {
    expect(normalizeQumlPlayerEvent(null)).toBeNull();
    expect(normalizeQumlPlayerEvent(undefined)).toBeUndefined();
    expect(normalizeQumlPlayerEvent('string')).toBe('string');
  });

  it('returns non-QUML_SUMMARY events unchanged', () => {
    const assessEvent = { eid: 'ASSESS', edata: { score: 5 } };
    expect(normalizeQumlPlayerEvent(assessEvent)).toBe(assessEvent);

    const startEvent = { eid: 'START', ets: 1700000000000 };
    expect(normalizeQumlPlayerEvent(startEvent)).toBe(startEvent);

    const endEvent = { eid: 'END', edata: { summary: [] } };
    expect(normalizeQumlPlayerEvent(endEvent)).toBe(endEvent);
  });

  it('normalizes a QUML_SUMMARY event (flat eid form)', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: {
        starttime: 1700000000000,
        extra: [
          { id: 'progress', value: '80' },
          { id: 'endpageseen', value: 'true' },
          { id: 'score', value: '5' },
          { id: 'correct', value: '3' },
          { id: 'incorrect', value: '1' },
          { id: 'skipped', value: '0' },
        ],
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.eid).toBe('QUML_SUMMARY');
    expect(result.ets).toBe(1700000000000);
    expect(result.edata.score).toBe(5);
    expect(result.edata.endpageseen).toBe(true);
  });

  it('normalizes a QUML_SUMMARY wrapped in QumlPlayerEvent.data', () => {
    const raw = {
      type: 'QUML_SUMMARY',
      data: {
        eid: 'QUML_SUMMARY',
        edata: {
          starttime: 1700000001000,
          extra: [
            { id: 'endpageseen', value: 'false' },
            { id: 'score', value: '0' },
          ],
        },
      },
      playerId: 'do_123',
      timestamp: 1700000002000,
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.eid).toBe('QUML_SUMMARY');
    expect(result.ets).toBe(1700000001000);
    expect(result.edata.score).toBe(0);
    expect(result.edata.endpageseen).toBe(false);
  });

  it('sets score to undefined when extra has no score entry', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: {
        starttime: 1700000000000,
        extra: [{ id: 'endpageseen', value: 'true' }],
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.edata.score).toBeUndefined();
  });

  it('sets endpageseen to false when extra has no endpageseen entry', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: {
        starttime: 1700000000000,
        extra: [{ id: 'score', value: '10' }],
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.edata.endpageseen).toBe(false);
  });

  it('coerces numeric score string to number', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: {
        extra: [
          { id: 'score', value: '7.5' },
          { id: 'endpageseen', value: 'true' },
        ],
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.edata.score).toBe(7.5);
  });

  it('accepts numeric score directly (not as string)', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: {
        extra: [
          { id: 'score', value: 4 },
          { id: 'endpageseen', value: 'true' },
        ],
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.edata.score).toBe(4);
  });

  it('sets ets to undefined when edata.starttime is absent', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: {
        extra: [{ id: 'score', value: '3' }],
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.ets).toBeUndefined();
  });

  it('handles empty extra array', () => {
    const raw = {
      eid: 'QUML_SUMMARY',
      edata: { starttime: 1700000000000, extra: [] },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.edata.score).toBeUndefined();
    expect(result.edata.endpageseen).toBe(false);
  });

  it('handles missing edata gracefully', () => {
    const raw = { eid: 'QUML_SUMMARY' };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.edata.score).toBeUndefined();
    expect(result.edata.endpageseen).toBe(false);
    expect(result.ets).toBeUndefined();
  });

  it('identifies QUML_SUMMARY via event.type when eid is on data', () => {
    const raw = {
      type: 'QUML_SUMMARY',
      data: {
        eid: 'QUML_SUMMARY',
        edata: {
          starttime: 1700000000000,
          extra: [
            { id: 'score', value: '2' },
            { id: 'endpageseen', value: 'true' },
          ],
        },
      },
    };
    const result = normalizeQumlPlayerEvent(raw) as any;
    expect(result.eid).toBe('QUML_SUMMARY');
    expect(result.edata.score).toBe(2);
  });
});
