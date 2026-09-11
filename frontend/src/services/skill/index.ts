import { SkillService } from './SkillService';

export { SkillService };
export const skillService = new SkillService();

export {
  normaliseProfile,
  normaliseGap,
  normaliseRecommendation,
  normaliseFrameworkMeta,
} from './skillMappers';

export {
  buildSkillVocabulary,
  groupSkillsByTier,
  frameworkCategories,
  skillName,
  isGrouped,
  type SkillVocabulary,
  type TierGroup,
  type TaxonomyFrameworkResponse,
} from './skillTree';
