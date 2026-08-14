export { parseLearningPath, isAssessmentCourse } from './learningPathMapper';
export {
  computeCourseProgress,
  computeLevelProgress,
  computePathProgress,
  deriveLevelStatuses,
  isOutcomeUnlocked,
  getAssessmentScore,
  getResumeTarget,
} from './learningPathProgress';
export { getAttainedLevels, getGainedSkills, SKILL_GAINING_STATUSES } from './skillAttainment';
export { buildPathSkillSummary, aggregateSkills, filterPathSummaries } from './skillAggregation';
export type { PathSkillSummary, PathSkillStatus, SkillAggregate, PathSkillFilters, SkillSourceRef } from './skillAggregation';
export { buildSkillIndex, getRecentlyGainedSkills, getMostReinforcedSkills, filterSkillEntries } from './skillIndex';
export type { SkillIndexEntry, SkillOrigin, SkillStatusFilter, SkillIndexFilters } from './skillIndex';
