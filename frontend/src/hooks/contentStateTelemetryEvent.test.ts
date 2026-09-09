import { describe, it, expect } from 'vitest';
import { sumAssessEventTotals } from './contentStateTelemetryEvent';

describe('sumAssessEventTotals', () => {
  it('sums edata.score and edata.item.maxscore across events', () => {
    const events = [
      { eid: 'ASSESS', edata: { score: 3, item: { id: 'q1', maxscore: 5 } } },
      { eid: 'ASSESS', edata: { score: 2, item: { id: 'q2', maxscore: 5 } } },
    ];
    expect(sumAssessEventTotals(events)).toEqual({ score: 5, maxScore: 10 });
  });

  // The player reports fractional scores for partial-credit questions.
  it('handles fractional scores', () => {
    const events = [{ eid: 'ASSESS', edata: { score: 0.5, item: { maxscore: 1 } } }];
    expect(sumAssessEventTotals(events)).toEqual({ score: 0.5, maxScore: 1 });
  });

  it('coerces numeric strings, as SCORM-style payloads use them', () => {
    const events = [{ eid: 'ASSESS', edata: { score: '4', item: { maxscore: '8' } } }];
    expect(sumAssessEventTotals(events)).toEqual({ score: 4, maxScore: 8 });
  });

  it('skips events with no edata, and non-object entries', () => {
    const events = [
      { eid: 'START' },
      null,
      'renderer:question:submitscore',
      { eid: 'ASSESS', edata: { score: 1, item: { maxscore: 2 } } },
    ];
    expect(sumAssessEventTotals(events)).toEqual({ score: 1, maxScore: 2 });
  });

  it('treats a missing maxscore as contributing nothing to the max', () => {
    const events = [{ eid: 'ASSESS', edata: { score: 1 } }];
    expect(sumAssessEventTotals(events)).toEqual({ score: 1, maxScore: 0 });
  });

  it('returns zeroes for an empty list', () => {
    expect(sumAssessEventTotals([])).toEqual({ score: 0, maxScore: 0 });
  });
});
