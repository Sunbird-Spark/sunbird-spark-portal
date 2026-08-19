import { useCallback, useMemo } from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useCollection } from '@/hooks/useCollection';
import { useContentRead } from '@/hooks/useContent';
import { useQumlContent } from '@/hooks/useQumlContent';
import { useContentView } from '@/hooks/useContentView';
import { getLeafContentIdsFromHierarchy } from '@/services/collection/hierarchyTree';
import { normalizeQumlPlayerEvent } from '@/services/players/playerEventNormalizer';
import { LearningPathPlayerCard } from '@/components/learningPath/LearningPathPlayerCard';
import { LearningPathRail } from '@/components/learningPath/LearningPathRail';
import PageLoader from '@/components/common/PageLoader';
import type { useLearningPath } from '@/hooks/useLearningPath';

type LearningPathData = ReturnType<typeof useLearningPath>;

interface LearningPathPlayerViewProps {
  lp: LearningPathData;
  courseId: string;
  contentId: string;
  onBackToPath: () => void;
  onOpenLevel: (levelId: string) => void;
  onOpenPrior: () => void;
  onOpenOutcome: () => void;
  onNavigateContent: (courseId: string, contentId: string) => void;
}

/**
 * The Learning Path's own player screen (design's `bPlayer`) - a lesson pane
 * with Previous/Next plus the Learning Path rail. Access is governed by the
 * Learning Path enrolment (not the inner course's own enrolment/state), and
 * there is no Units/Lessons sidebar - Previous/Next step through the current
 * course's own leaves only.
 */
export function LearningPathPlayerView({
  lp,
  courseId,
  contentId,
  onBackToPath,
  onOpenLevel,
  onOpenPrior,
  onOpenOutcome,
  onNavigateContent,
}: LearningPathPlayerViewProps) {
  const { t } = useAppI18n();
  const { model, progress, levelProgress, levelStatuses, priorState, outcomeState, certificateUnlocked, enrollment, pathSummary, summaryByCollectionId } = lp;

  const { data: courseData, isLoading: courseLoading } = useCollection(courseId);
  const leafIds = useMemo(
    () => getLeafContentIdsFromHierarchy(courseData?.hierarchyRoot ?? null),
    [courseData]
  );
  const currentIndex = leafIds.indexOf(contentId);

  const { data: contentReadData, isLoading: contentIsLoading, error: contentError } = useContentRead(contentId, {
    enrichTranscripts: true,
  });
  const selectedContentData = contentReadData?.data?.content;
  const isQumlContent =
    selectedContentData?.mimeType === 'application/vnd.sunbird.questionset' ||
    selectedContentData?.mimeType === 'application/vnd.sunbird.question';
  const { data: qumlData, isLoading: qumlIsLoading, error: qumlError } = useQumlContent(contentId, {
    enabled: isQumlContent,
  });
  const playerMetadata = isQumlContent ? qumlData : selectedContentData;
  const playerIsLoading = isQumlContent ? qumlIsLoading : contentIsLoading;
  const playerError = isQumlContent ? qumlError : contentError;

  const lpContextId = enrollment.effectiveContextId;
  const currentContentStatus = pathSummary?.contentStatus?.[contentId];

  // Scoped to the Learning Path ROOT (model.identifier) + its own plain batch
  // id, NOT the inner course + a synthetic `<lpContextId>:<courseId>` composite.
  // Verified live against the deployed lern-service: the composite context has
  // no backing `user_enrolments` row (the child-batch fan-out that would create
  // one is an explicitly deferred Learning-Path-progression feature, not yet
  // shipped server-side - view/start|update|end all return SUCCESS against it,
  // but summary/read for that exact courseId+batchId comes back empty, so
  // nothing is ever readable/resumable). The LP root's enrolment row DOES exist
  // (the learner joined the path itself), and `ViewerAggregatorActor`'s rollup
  // is built to be driven by courseId=root/batchId=plain-batch: it reads every
  // leaf under the root's own published hierarchy and rolls the per-content
  // status up into that root row, which is exactly the record `pathSummary`
  // above already reads from.
  const handleContentView = useContentView({
    collectionId: model.identifier,
    contentId,
    contextId: lpContextId,
    isEnrolledInCurrentBatch: enrollment.isEnrolled,
    mimeType: (playerMetadata as { mimeType?: string } | undefined)?.mimeType,
    currentContentStatus,
  });

  // Standard telemetry (START/ASSESS/END) arrives via onTelemetryEvent unchanged.
  // The QUML player's terminal QUML_SUMMARY event (used for the prior/outcome
  // assessment and any Question Set course) arrives via onPlayerEvent instead -
  // without this, question-set progress/score never reaches useContentView.
  const handlePlayerEvent = useCallback(
    (event: unknown) => handleContentView(normalizeQumlPlayerEvent(event) as Parameters<typeof handleContentView>[0]),
    [handleContentView]
  );

  const course = [
    ...(model.priorAssessment ? [model.priorAssessment] : []),
    ...model.levels.flatMap((l) => l.courses),
    ...(model.outcomeAssessment ? [model.outcomeAssessment] : []),
  ].find((c) => c.identifier === courseId);

  const levelIndex = model.levels.findIndex((l) => l.courses.some((c) => c.identifier === courseId));
  const level = levelIndex >= 0 ? model.levels[levelIndex] : undefined;
  const crumb = level
    ? t('learningPath.playerCrumb', {
        num: levelIndex + 1,
        levelName: level.name,
        unitIndex: currentIndex + 1,
        unitTotal: leafIds.length || 1,
      })
    : (course?.name ?? '');

  if (!enrollment.isEnrolled) {
    return <PageLoader error={t('learningPath.mustJoinPath')} onRetry={onBackToPath} />;
  }

  if (courseLoading) return <PageLoader />;

  return (
    <div className="flex-1 min-w-0 mx-auto grid max-w-[93.75rem] grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[1fr_23.75rem] lg:items-start">
      <LearningPathPlayerCard
        title={course?.name ?? ''}
        crumb={crumb}
        isCompleted={currentContentStatus === 2}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex >= 0 && currentIndex < leafIds.length - 1}
        onPrevious={() => {
          const prev = leafIds[currentIndex - 1];
          if (prev) onNavigateContent(courseId, prev);
        }}
        onNext={() => {
          const next = leafIds[currentIndex + 1];
          if (next) onNavigateContent(courseId, next);
        }}
        playerIsLoading={playerIsLoading}
        playerError={playerError ?? null}
        playerMetadata={playerMetadata as { mimeType: string } | undefined}
        onPlayerEvent={handlePlayerEvent}
        onTelemetryEvent={handleContentView}
      />
      <LearningPathRail
        pathTitle={model.name}
        model={model}
        progress={progress}
        levelProgress={levelProgress}
        levelStatuses={levelStatuses}
        priorDone={priorState.done}
        outcomeUnlocked={outcomeState.unlocked}
        certificateUnlocked={certificateUnlocked}
        outcomeDone={outcomeState.done}
        summaryByCollectionId={summaryByCollectionId}
        pathSummary={pathSummary}
        activeCourseId={courseId}
        activeContentId={contentId}
        onBackToPath={onBackToPath}
        onOpenLevel={onOpenLevel}
        onOpenPrior={onOpenPrior}
        onOpenOutcome={model.outcomeAssessment ? onOpenOutcome : undefined}
        onOpenCourse={onNavigateContent}
      />
    </div>
  );
}
