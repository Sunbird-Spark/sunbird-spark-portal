import { CompetencyService } from './CompetencyService';

export { CompetencyService };
export const competencyService = new CompetencyService();

export { normalisePassbook, isHeld, primaryFrameworkId, humaniseCode } from './passbookMapper';
export { normaliseGap, sortGapRows, normaliseFrameworkMeta, levelLabel, topLevelIndex } from './gapMapper';
