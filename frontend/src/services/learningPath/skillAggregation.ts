import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';
import type { LearningPathModel, LPLevelNode } from '../../types/learningPathTypes';
import { computeCourseProgress, computeLevelProgress, computePathProgress, deriveLevelStatuses } from './learningPathProgress';
import { getAttainedLevels, getGainedSkills } from './skillAttainment';

export type PathSkillStatus = 'completed' | 'ongoing' | 'not-started';

/** Where one skill comes from inside one path — the Level that teaches it. */
export interface SkillSourceRef {
  skill: string;
  levelId: string;
  levelName: string;
  levelIndex: number;
  gained: boolean;
  /** When the Level was finished, when the summary records carry a timestamp. */
  gainedAt?: number;
}

/** One enrolled Learning Path, reduced to what the aggregate skills page renders. */
export interface PathSkillSummary {
  pathId: string;
  contextId?: string;
  pathName: string;
  progressPct: number;
  status: PathSkillStatus;
  allSkills: string[];
  gainedSkills: ReadonlySet<string>;
  gainedCount: number;
  pendingCount: number;
  /** Every (skill, Level) pair in this path — the trail back to where a skill was earned. */
  skillSources: SkillSourceRef[];
}

/** Aggregate tallies across every analyzed path. */
export interface SkillAggregate {
  totalSkills: number;
  gainedSkills: number;
  pendingSkills: number;
  pathsCompleted: number;
  pathsOngoing: number;
}

function toTimestamp(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
}

/**
 * When a Level's skills were earned: the latest completion timestamp among its
 * courses, since the Level is only attained once the last one lands. Falls back
 * to the path record when the per-course records carry no timestamp.
 */
function levelGainedAt(
  level: LPLevelNode,
  summaryByCollectionId: Map<string, ViewerSummaryRecord>,
  pathSummary: ViewerSummaryRecord | undefined
): number | undefined {
  const stamps = level.courses
    .map((course) => summaryByCollectionId.get(course.identifier))
    .map((record) => toTimestamp(record?.completedOn) ?? toTimestamp(record?.lastContentAccessTime))
    .filter((t): t is number => t !== undefined);

  if (stamps.length > 0) return Math.max(...stamps);
  return toTimestamp(pathSummary?.completedOn) ?? toTimestamp(pathSummary?.lastContentAccessTime);
}

/**
 * Reduces one path's hierarchy + progress into its skill summary.
 *
 * Mirrors the per-path status page (`LearningPathStatusView`): a Level's skills
 * count as gained on completion or on a waiver/credit, independent of the
 * unlock policy. Waivers are intentionally not fetched here — `useLevelWaivers`
 * is a stub returning `{}` today, so omitting them is behaviour-identical. When
 * a real waiver API ships, this page must adopt it or waived skills undercount.
 */
export function buildPathSkillSummary(
  model: LearningPathModel,
  pathSummary: ViewerSummaryRecord | undefined,
  summaryByCollectionId: Map<string, ViewerSummaryRecord>,
  contextId?: string
): PathSkillSummary {
  const levelProgress = model.levels.map((level) => computeLevelProgress(level, summaryByCollectionId, pathSummary));

  const priorProgress = model.priorAssessment
    ? computeCourseProgress(model.priorAssessment, summaryByCollectionId, pathSummary)
    : null;
  const priorDone = !model.priorAssessment || (priorProgress?.pct ?? 0) >= 100;

  const levelStatuses = deriveLevelStatuses(model, model.policy, levelProgress, priorDone);
  const attainedLevels = getAttainedLevels(levelProgress, levelStatuses);
  const gainedSkills = getGainedSkills(model.levels, attainedLevels);

  const skillSources: SkillSourceRef[] = model.levels.flatMap((level, i) => {
    const gained = !!attainedLevels[i];
    const gainedAt = gained ? levelGainedAt(level, summaryByCollectionId, pathSummary) : undefined;
    return level.skills.map((skill) => ({
      skill,
      levelId: level.identifier,
      levelName: level.name,
      levelIndex: i + 1,
      gained,
      gainedAt,
    }));
  });

  const gainedCount = model.allSkills.filter((skill) => gainedSkills.has(skill)).length;
  const progressPct = computePathProgress(model, pathSummary, summaryByCollectionId).pct;

  return {
    pathId: model.identifier,
    contextId,
    pathName: model.name,
    progressPct,
    status: progressPct >= 100 ? 'completed' : progressPct > 0 ? 'ongoing' : 'not-started',
    allSkills: model.allSkills,
    gainedSkills,
    gainedCount,
    pendingCount: model.allSkills.length - gainedCount,
    skillSources,
  };
}

/**
 * Tallies across paths. Skills are unioned by name: the same skill taught by two
 * paths is one skill, and gaining it anywhere counts as gained everywhere.
 */
export function aggregateSkills(summaries: PathSkillSummary[]): SkillAggregate {
  const all = new Set<string>();
  const gained = new Set<string>();

  summaries.forEach((summary) => {
    summary.allSkills.forEach((skill) => all.add(skill));
    summary.gainedSkills.forEach((skill) => gained.add(skill));
  });

  return {
    totalSkills: all.size,
    gainedSkills: gained.size,
    pendingSkills: all.size - gained.size,
    pathsCompleted: summaries.filter((s) => s.status === 'completed').length,
    pathsOngoing: summaries.filter((s) => s.status === 'ongoing').length,
  };
}

export interface PathSkillFilters {
  query?: string;
  status?: PathSkillStatus | 'all';
}

/** Free-text match on the path name or any of its skills, plus a status narrow. */
export function filterPathSummaries(summaries: PathSkillSummary[], filters: PathSkillFilters): PathSkillSummary[] {
  const query = (filters.query ?? '').trim().toLowerCase();
  const status = filters.status ?? 'all';

  return summaries.filter((summary) => {
    if (status !== 'all' && summary.status !== status) return false;
    if (!query) return true;
    return (
      summary.pathName.toLowerCase().includes(query) ||
      summary.allSkills.some((skill) => skill.toLowerCase().includes(query))
    );
  });
}
