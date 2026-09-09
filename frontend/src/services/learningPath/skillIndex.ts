import type { PathSkillSummary, PathSkillStatus } from './skillAggregation';

/** One place a skill is taught: a Level inside a specific enrolled path. */
export interface SkillOrigin {
  pathId: string;
  contextId?: string;
  pathName: string;
  pathStatus: PathSkillStatus;
  levelName: string;
  levelIndex: number;
  gained: boolean;
  gainedAt?: number;
}

/** A skill as the learner experiences it: earned or not, and everywhere it comes from. */
export interface SkillIndexEntry {
  skill: string;
  gained: boolean;
  /** Earliest moment the skill was earned, across all the paths that teach it. */
  gainedAt?: number;
  /** Distinct paths that teach this skill — how reinforced it is. */
  pathCount: number;
  origins: SkillOrigin[];
}

/**
 * Inverts path→skills into skill→paths, the view that answers "where did I earn
 * this?". A skill taught by several paths appears once, carrying every origin;
 * it counts as gained if any single path granted it.
 */
export function buildSkillIndex(summaries: PathSkillSummary[]): SkillIndexEntry[] {
  const bySkill = new Map<string, SkillIndexEntry>();

  summaries.forEach((summary) => {
    summary.skillSources.forEach((source) => {
      const entry = bySkill.get(source.skill) ?? {
        skill: source.skill,
        gained: false,
        pathCount: 0,
        origins: [],
      };

      entry.origins.push({
        pathId: summary.pathId,
        contextId: summary.contextId,
        pathName: summary.pathName,
        pathStatus: summary.status,
        levelName: source.levelName,
        levelIndex: source.levelIndex,
        gained: source.gained,
        gainedAt: source.gainedAt,
      });

      if (source.gained) {
        entry.gained = true;
        if (source.gainedAt !== undefined) {
          entry.gainedAt = entry.gainedAt === undefined ? source.gainedAt : Math.min(entry.gainedAt, source.gainedAt);
        }
      }

      bySkill.set(source.skill, entry);
    });
  });

  const entries = [...bySkill.values()];
  entries.forEach((entry) => {
    entry.pathCount = new Set(entry.origins.map((o) => o.pathId)).size;
    // Gained origins first, then by path name, so the trail reads earned-first.
    entry.origins.sort((a, b) => Number(b.gained) - Number(a.gained) || a.pathName.localeCompare(b.pathName));
  });

  return entries.sort((a, b) => a.skill.localeCompare(b.skill));
}

/** Most recently earned skills first. Skills with no timestamp are omitted — order would be a guess. */
export function getRecentlyGainedSkills(entries: SkillIndexEntry[], limit = 5): SkillIndexEntry[] {
  return entries
    .filter((entry) => entry.gained && entry.gainedAt !== undefined)
    .sort((a, b) => (b.gainedAt ?? 0) - (a.gainedAt ?? 0))
    .slice(0, limit);
}

/** Skills taught by the most distinct paths — what the learner's plan reinforces most. */
export function getMostReinforcedSkills(entries: SkillIndexEntry[], limit = 5): SkillIndexEntry[] {
  return entries
    .filter((entry) => entry.pathCount > 1)
    .sort((a, b) => b.pathCount - a.pathCount || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

export type SkillStatusFilter = 'all' | 'gained' | 'pending';

export interface SkillIndexFilters {
  query?: string;
  status?: SkillStatusFilter;
}

/** Narrows the skill list by free text (skill or source path name) and gained/pending. */
export function filterSkillEntries(entries: SkillIndexEntry[], filters: SkillIndexFilters): SkillIndexEntry[] {
  const query = (filters.query ?? '').trim().toLowerCase();
  const status = filters.status ?? 'all';

  return entries.filter((entry) => {
    if (status === 'gained' && !entry.gained) return false;
    if (status === 'pending' && entry.gained) return false;
    if (!query) return true;
    return (
      entry.skill.toLowerCase().includes(query) ||
      entry.origins.some((origin) => origin.pathName.toLowerCase().includes(query))
    );
  });
}
