import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useLearningPath } from '@/hooks/useLearningPath';
import { usePermissions } from '@/hooks/usePermission';
import useImpression from '@/hooks/useImpression';
import PageLoader from '@/components/common/PageLoader';
import { LevelDetailView } from '@/components/learningPath/LevelDetailView';
import { PriorAssessmentGate } from '@/components/learningPath/PriorAssessmentGate';
import { PathCompletionView } from '@/components/learningPath/PathCompletionView';
import { LearningPathOverview } from './LearningPathOverview';
import { LearningPathPlayerView } from './LearningPathPlayerView';
import { getAssessmentScore } from '@/services/learningPath/learningPathProgress';
import type { ScoreRow } from '@/components/learningPath/ScoreRows';

const LearningPathPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathId, contextId, levelId, courseId, contentId } = useParams<{
    pathId: string;
    contextId?: string;
    levelId?: string;
    courseId?: string;
    contentId?: string;
  }>();
  const { t } = useAppI18n();
  const { isAuthenticated } = usePermissions();

  useImpression({
    type: 'view',
    pageid: 'learning-path-detail',
    env: 'course',
    object: { id: pathId ?? '', type: 'Learning Path' },
  });

  const lp = useLearningPath(pathId, contextId);
  const { model, policy, levelStatuses, pathSummary } = lp;

  const basePath = contextId ? `/learning-path/${pathId}/batch/${contextId}` : `/learning-path/${pathId}`;
  const goOverview = () => navigate(basePath);
  const goLevel = (id: string) => navigate(`${basePath}/level/${id}`);
  const goPrior = () => navigate(`${basePath}/prior`);

  // Opens the Learning Path's own player screen (design's `bPlayer`) - no
  // Units/Lessons sidebar, no separate course-level enrolment gate.
  const openCourse = (openCourseId: string, openContentId: string) => {
    if (!openContentId) return;
    navigate(`${basePath}/course/${openCourseId}/content/${openContentId}`);
  };

  if (lp.isLoading) return <PageLoader />;
  if (lp.isError || !model.identifier) {
    return <PageLoader error={t('somethingWentWrong')} onRetry={() => window.location.reload()} />;
  }

  if (courseId && contentId) {
    return (
      <LearningPathPlayerView
        lp={lp}
        courseId={courseId}
        contentId={contentId}
        onBackToPath={goOverview}
        onOpenLevel={goLevel}
        onOpenPrior={goPrior}
        onNavigateContent={openCourse}
      />
    );
  }

  if (location.pathname.endsWith('/prior') && model.priorAssessment) {
    return (
      <div className="flex-1 min-w-0 mx-auto max-w-[85rem] px-6 py-7">
        <PriorAssessmentGate
          priorAssessment={model.priorAssessment}
          policy={policy}
          allSkills={model.allSkills}
          bestScore={getAssessmentScore(model.priorAssessment.identifier, pathSummary)}
          onStart={() => openCourse(model.priorAssessment!.identifier, model.priorAssessment!.leafIds[0] ?? '')}
          onSkip={goOverview}
        />
      </div>
    );
  }

  if (location.pathname.endsWith('/complete')) {
    const scores: ScoreRow[] = [];
    if (model.priorAssessment) {
      const s = getAssessmentScore(model.priorAssessment.identifier, pathSummary);
      scores.push({
        name: model.priorAssessment.name,
        sub: t('learningPath.priorAssessmentSub'),
        score: s ? `${s.score}/${s.maxScore}` : '—',
        pct: s ? Math.round((s.score / s.maxScore) * 100) : 0,
      });
    }
    if (model.outcomeAssessment) {
      const s = getAssessmentScore(model.outcomeAssessment.identifier, pathSummary);
      scores.push({
        name: model.outcomeAssessment.name,
        sub: t('learningPath.outcomeAssessmentSub'),
        score: s ? `${s.score}/${s.maxScore}` : '—',
        pct: s ? Math.round((s.score / s.maxScore) * 100) : 0,
      });
    }
    return (
      <div className="flex-1 min-w-0 px-6 py-7">
        <PathCompletionView
          pathTitle={model.name}
          levelCount={model.levels.length}
          scores={scores}
          skills={model.allSkills}
          hasCertificate={(pathSummary?.issuedCertificates?.length ?? 0) > 0}
        />
      </div>
    );
  }

  if (levelId) {
    const idx = model.levels.findIndex((l) => l.identifier === levelId);
    const level = model.levels[idx];
    if (level) {
      return (
        <div className="flex-1 min-w-0 mx-auto max-w-[85rem] px-6 py-7">
          <LevelDetailView
            level={level}
            levelNumber={idx + 1}
            progress={lp.levelProgress[idx] ?? { pct: 0, completed: 0, total: 0, doneCourses: 0 }}
            status={levelStatuses[idx] ?? 'locked'}
            summaryByCollectionId={lp.summaryByCollectionId}
            pathSummary={pathSummary}
            onBack={goOverview}
            onOpenCourse={openCourse}
          />
        </div>
      );
    }
  }

  return (
    <LearningPathOverview
      lp={lp}
      isAuthenticated={isAuthenticated}
      onOpenLevel={goLevel}
      onOpenPrior={goPrior}
      onOpenCourse={openCourse}
    />
  );
};

export default LearningPathPage;
