import { describe, it, expect } from 'vitest';
import {
  buildSkillIndex,
  filterSkillEntries,
  getMostReinforcedSkills,
  getRecentlyGainedSkills,
} from './skillIndex';
import type { PathSkillSummary, SkillSourceRef } from './skillAggregation';

function summary(overrides: Partial<PathSkillSummary> & { skillSources: SkillSourceRef[] }): PathSkillSummary {
  const gained = new Set(overrides.skillSources.filter((s) => s.gained).map((s) => s.skill));
  const allSkills = [...new Set(overrides.skillSources.map((s) => s.skill))];
  return {
    pathId: 'p1',
    contextId: 'ctx1',
    pathName: 'Path One',
    progressPct: 50,
    status: 'ongoing',
    allSkills,
    gainedSkills: gained,
    gainedCount: gained.size,
    pendingCount: allSkills.length - gained.size,
    ...overrides,
  };
}

function source(skill: string, gained: boolean, gainedAt?: number, levelName = 'Level 1'): SkillSourceRef {
  return { skill, levelId: `lvl-${skill}`, levelName, levelIndex: 1, gained, gainedAt };
}

describe('buildSkillIndex', () => {
  it('returns nothing for no paths', () => {
    expect(buildSkillIndex([])).toEqual([]);
  });

  it('records every origin of a skill and counts distinct paths', () => {
    const index = buildSkillIndex([
      summary({ pathId: 'p1', pathName: 'Path One', skillSources: [source('SQL', true, 1_000)] }),
      summary({ pathId: 'p2', pathName: 'Path Two', skillSources: [source('SQL', false)] }),
    ]);

    expect(index).toHaveLength(1);
    expect(index[0]?.skill).toBe('SQL');
    expect(index[0]?.pathCount).toBe(2);
    expect(index[0]?.origins.map((o) => o.pathName)).toEqual(['Path One', 'Path Two']);
  });

  it('counts a skill as gained when any single path granted it', () => {
    const index = buildSkillIndex([
      summary({ pathId: 'p1', skillSources: [source('SQL', false)] }),
      summary({ pathId: 'p2', skillSources: [source('SQL', true, 500)] }),
    ]);

    expect(index[0]?.gained).toBe(true);
    expect(index[0]?.gainedAt).toBe(500);
  });

  it('keeps the earliest gained timestamp across paths', () => {
    const index = buildSkillIndex([
      summary({ pathId: 'p1', skillSources: [source('SQL', true, 900)] }),
      summary({ pathId: 'p2', skillSources: [source('SQL', true, 300)] }),
    ]);

    expect(index[0]?.gainedAt).toBe(300);
  });

  it('lists gained origins before pending ones', () => {
    const index = buildSkillIndex([
      summary({ pathId: 'p1', pathName: 'Aaa Pending', skillSources: [source('SQL', false)] }),
      summary({ pathId: 'p2', pathName: 'Zzz Gained', skillSources: [source('SQL', true, 100)] }),
    ]);

    expect(index[0]?.origins.map((o) => o.gained)).toEqual([true, false]);
  });
});

describe('getRecentlyGainedSkills', () => {
  it('orders by most recent first and omits skills with no timestamp', () => {
    const index = buildSkillIndex([
      summary({
        pathId: 'p1',
        skillSources: [source('Old', true, 100), source('New', true, 900), source('Untimed', true), source('Pending', false)],
      }),
    ]);

    expect(getRecentlyGainedSkills(index).map((e) => e.skill)).toEqual(['New', 'Old']);
  });

  it('respects the limit', () => {
    const index = buildSkillIndex([
      summary({ pathId: 'p1', skillSources: [source('A', true, 1), source('B', true, 2), source('C', true, 3)] }),
    ]);

    expect(getRecentlyGainedSkills(index, 2).map((e) => e.skill)).toEqual(['C', 'B']);
  });
});

describe('getMostReinforcedSkills', () => {
  it('returns only skills taught by more than one path, most-taught first', () => {
    const index = buildSkillIndex([
      summary({ pathId: 'p1', skillSources: [source('Shared', true, 1), source('Once', false)] }),
      summary({ pathId: 'p2', skillSources: [source('Shared', false)] }),
      summary({ pathId: 'p3', skillSources: [source('Shared', false)] }),
    ]);

    const reinforced = getMostReinforcedSkills(index);
    expect(reinforced).toHaveLength(1);
    expect(reinforced[0]?.skill).toBe('Shared');
    expect(reinforced[0]?.pathCount).toBe(3);
  });
});

describe('filterSkillEntries', () => {
  const index = buildSkillIndex([
    summary({ pathId: 'p1', pathName: 'Data Foundations', skillSources: [source('SQL', true, 10)] }),
    summary({ pathId: 'p2', pathName: 'Cloud Basics', skillSources: [source('AWS', false)] }),
  ]);

  it('matches on the skill name', () => {
    expect(filterSkillEntries(index, { query: 'sq' }).map((e) => e.skill)).toEqual(['SQL']);
  });

  it('matches on a source path name', () => {
    expect(filterSkillEntries(index, { query: 'cloud' }).map((e) => e.skill)).toEqual(['AWS']);
  });

  it('filters by gained and pending', () => {
    expect(filterSkillEntries(index, { status: 'gained' }).map((e) => e.skill)).toEqual(['SQL']);
    expect(filterSkillEntries(index, { status: 'pending' }).map((e) => e.skill)).toEqual(['AWS']);
  });

  it('returns everything with no filters', () => {
    expect(filterSkillEntries(index, {})).toHaveLength(2);
  });
});
