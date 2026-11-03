import { useMemo } from 'react';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { dynamicAssessForLearner, isDynamicAssessUnavailable } from '@/services/players/dynamicAssessSubset';
import { useAppI18n } from '@/hooks/useAppI18n';

/** Player metadata with this learner's Dynamic Assess draw applied (useQumlContent already draws for QuestionSets), plus an error when Dynamic content has nothing playable yet; other content passes through unchanged. */
export const useLearnerPlayerMetadata = (
  contentData: any,
  qumlData: any,
  isQumlContent: boolean,
): { playerMetadata: any; notReadyError: Error | null } => {
  const { t } = useAppI18n();
  const learnerId = userAuthInfoService.getUserId();
  const playerMetadata = useMemo(
    () => (isQumlContent ? qumlData : dynamicAssessForLearner(contentData, learnerId)),
    [isQumlContent, qumlData, contentData, learnerId],
  );
  const notReady = isDynamicAssessUnavailable(playerMetadata);
  const notReadyError = useMemo(() => (notReady ? new Error(t('content.dynamicAssessNotReady')) : null), [notReady, t]);
  return { playerMetadata, notReadyError };
};
