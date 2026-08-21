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
export { getAssessmentInfo, buildAssessmentInfoMap } from './learningPathAssessment';
export type { LPAssessmentInfo } from './learningPathAssessment';
export { getAttainedLevels, getGainedSkills, SKILL_GAINING_STATUSES } from './skillAttainment';
export { buildPathSkillSummary, aggregateSkills, filterPathSummaries } from './skillAggregation';
export type { PathSkillSummary, PathSkillStatus, SkillAggregate, PathSkillFilters, SkillSourceRef } from './skillAggregation';
export { buildSkillIndex, getRecentlyGainedSkills, getMostReinforcedSkills, filterSkillEntries } from './skillIndex';
export type { SkillIndexEntry, SkillOrigin, SkillStatusFilter, SkillIndexFilters } from './skillIndex';
export { buildSkillGrowthSeries } from './skillGrowth';
export type { SkillGrowthPoint, SkillGrowthSeries } from './skillGrowth';
