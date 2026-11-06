import { describe, it, expect } from 'vitest';
import { availabilityLimit, groupAvailableTypes } from './availability';

describe('groupAvailableTypes', () => {
  it('groups the enrichment types by parent content, without duplicates', () => {
    expect(
      groupAvailableTypes({
        EnrichmentObject: [
          { parentId: 'do_1', enrichmentObjectType: 'Transcript' },
          { parentId: 'do_1', enrichmentObjectType: 'Transcript' },
          { parentId: 'do_1', enrichmentObjectType: 'Summary' },
          { parentId: 'do_2', enrichmentObjectType: 'Transcript' },
        ],
      }),
    ).toEqual({ do_1: ['Transcript', 'Summary'], do_2: ['Transcript'] });
  });

  it('returns an empty map for no response or no objects (negative)', () => {
    expect(groupAvailableTypes(undefined)).toEqual({});
    expect(groupAvailableTypes({})).toEqual({});
  });

  it('skips objects missing a parentId or type (negative)', () => {
    expect(groupAvailableTypes({ EnrichmentObject: [{ enrichmentObjectType: 'Transcript' }, { parentId: 'do_1' }] })).toEqual({});
  });
});

describe('availabilityLimit', () => {
  it('scales with the number of ids and is capped at the search window', () => {
    expect(availabilityLimit(5)).toBe(100);
    expect(availabilityLimit(5000)).toBe(10000);
  });
});
