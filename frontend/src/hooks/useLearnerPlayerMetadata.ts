import { useMemo } from 'react';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { dynamicAssessForLearner, dynamicAssessFullPool, isDynamicAssessUnavailable } from '@/services/players/dynamicAssessSubset';
import { useAppI18n } from '@/hooks/useAppI18n';

/** Player metadata with this learner's Dynamic Assess draw applied, or the whole pool with `fullPool` (useQumlContent already handles QuestionSets), plus an error when Dynamic content has nothing playable yet; other content passes through unchanged. */
export const useLearnerPlayerMetadata = (
  contentData: any,
  qumlData: any,
  isQumlContent: boolean,
  options?: { fullPool?: boolean },
): { playerMetadata: any; notReadyError: Error | null } => {
  const { t } = useAppI18n();
  const learnerId = userAuthInfoService.getUserId();
  const fullPool = options?.fullPool ?? false;
  const playerMetadata = useMemo(() => {
    if (isQumlContent) return qumlData;
    return fullPool ? dynamicAssessFullPool(contentData) : dynamicAssessForLearner(contentData, learnerId);
  }, [isQumlContent, qumlData, contentData, learnerId, fullPool]);
  const notReady = isDynamicAssessUnavailable(playerMetadata);
  const notReadyError = useMemo(() => (notReady ? new Error(t('content.dynamicAssessNotReady')) : null), [notReady, t]);
  return { playerMetadata, notReadyError };
};
