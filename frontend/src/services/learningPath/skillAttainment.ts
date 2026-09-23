import type { LevelProgressInfo, LevelStatusKey, LPLevelNode } from '../../types/learningPathTypes';

/** Level statuses that count as the level's skills having been gained, regardless of progress. */
export const SKILL_GAINING_STATUSES: ReadonlySet<LevelStatusKey> = new Set(['completed', 'waived', 'credited']);

/**
 * Which Levels the learner has actually attained.
 *
 * Deliberately ignores the path's unlock policy: the status page reports what
 * has been earned, so a Level counts on its own completion (100%) or on a
 * granted waiver/credit — never on whether the policy would currently let the
 * learner *enter* it.
 */
export function getAttainedLevels(levelProgress: LevelProgressInfo[], levelStatuses: LevelStatusKey[]): boolean[] {
  return levelProgress.map((progress, i) => {
    const status = levelStatuses[i];
    return progress.pct >= 100 || (!!status && SKILL_GAINING_STATUSES.has(status));
  });
}

/** The union of every attained Level's skills — the skills the learner has gained so far. */
export function getGainedSkills(levels: LPLevelNode[], attainedLevels: boolean[]): Set<string> {
  const gained = new Set<string>();
  levels.forEach((level, i) => {
    if (attainedLevels[i]) level.skills.forEach((skill) => gained.add(skill));
  });
  return gained;
}
