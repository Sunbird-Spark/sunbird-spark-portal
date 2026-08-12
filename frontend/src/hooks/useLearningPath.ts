import { useMemo } from 'react';
import { useCollection } from './useCollection';
import { useViewerSummary } from './useViewerSummary';
import { useLearningPathEnrollment } from './useLearningPathEnrollment';
import { useLevelWaivers } from './useLevelWaivers';
import { useIsAuthenticated } from './useAuthInfo';
import { parseLearningPath } from '../services/learningPath/learningPathMapper';
import {
  computeCourseProgress,
  computeLevelProgress,
  computePathProgress,
  deriveLevelStatuses,
  isOutcomeUnlocked,
  getResumeTarget,
} from '../services/learningPath/learningPathProgress';
import { getPathSummary, indexSummaryByCollectionId } from '../services/viewer/summaryMapper';

/**
 * Composes the Learning Path hierarchy, Viewer Service progress, and
 * enrolment state into the single object every LP screen consumes.
 */
export function useLearningPath(pathId: string | undefined, contextIdParam: string | undefined) {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { data: hierarchyData, isLoading: hierarchyLoading, isError: hierarchyError } = useCollection(pathId);
  const { data: summaryRecords = [], isLoading: summaryLoading } = useViewerSummary();
  const enrollment = useLearningPathEnrollment(pathId, contextIdParam, summaryRecords, isAuthenticated);
  const waivers = useLevelWaivers(pathId);

  const model = useMemo(() => parseLearningPath(hierarchyData?.hierarchyRoot ?? null), [hierarchyData]);
  const pathSummary = useMemo(
    () => getPathSummary(summaryRecords, pathId, contextIdParam),
    [summaryRecords, pathId, contextIdParam]
  );
  const summaryByCollectionId = useMemo(() => indexSummaryByCollectionId(summaryRecords), [summaryRecords]);

  const progress = useMemo(
    () => computePathProgress(model, pathSummary, summaryByCollectionId),
    [model, pathSummary, summaryByCollectionId]
  );

  const levelProgress = useMemo(
    () => model.levels.map((level) => computeLevelProgress(level, summaryByCollectionId, pathSummary)),
    [model.levels, summaryByCollectionId, pathSummary]
  );

  const priorProgress = useMemo(
    () =>
      model.priorAssessment
        ? computeCourseProgress(model.priorAssessment, summaryByCollectionId, pathSummary)
        : null,
    [model.priorAssessment, summaryByCollectionId, pathSummary]
  );
  const priorState = { progress: priorProgress, done: !model.priorAssessment || (priorProgress?.pct ?? 0) >= 100 };

  const outcomeProgress = useMemo(
    () =>
      model.outcomeAssessment
        ? computeCourseProgress(model.outcomeAssessment, summaryByCollectionId, pathSummary)
        : null,
    [model.outcomeAssessment, summaryByCollectionId, pathSummary]
  );
  const outcomeState = {
    progress: outcomeProgress,
    unlocked: isOutcomeUnlocked(levelProgress),
  };

  const levelStatuses = useMemo(
    () => deriveLevelStatuses(model, model.policy, levelProgress, priorState.done, waivers),
    [model, levelProgress, priorState.done, waivers]
  );

  const resumeTarget = useMemo(
    () => getResumeTarget(model, pathSummary, summaryRecords),
    [model, pathSummary, summaryRecords]
  );

  return {
    model,
    policy: model.policy,
    progress,
    levelProgress,
    levelStatuses,
    priorState,
    outcomeState,
    enrollment,
    resumeTarget,
    pathSummary,
    summaryByCollectionId,
    summaryRecords,
    isLoading: authLoading || hierarchyLoading || summaryLoading,
    isError: hierarchyError,
  };
}
