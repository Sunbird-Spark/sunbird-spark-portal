import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningPath } from '@/hooks/useLearningPath';
import { parseCourseContextId } from '@/services/viewer/summaryMapper';
import { LearningPathRail } from './LearningPathRail';

interface LearningPathRailContainerProps {
  /** The current course's context id — the composite `<lpContextId>:<courseId>` batch id from the route. */
  courseContextId: string | undefined;
}

/**
 * Reads `?lp=` off the current course URL and renders the Learning Path
 * player-chrome rail (see plan §5/§10). Self-contained: `CollectionSidePanel`
 * only needs to render this conditionally — no new props to thread through
 * the existing prop-group interfaces.
 */
export function LearningPathRailContainer({ courseContextId }: LearningPathRailContainerProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pathId = searchParams.get('lp') ?? undefined;
  const lpContextId = courseContextId ? parseCourseContextId(courseContextId)?.lpContextId : undefined;

  const lp = useLearningPath(pathId, lpContextId);

  if (!pathId || lp.isLoading || !lp.model.identifier) return null;

  const basePath = lpContextId ? `/learning-path/${pathId}/batch/${lpContextId}` : `/learning-path/${pathId}`;

  return (
    <LearningPathRail
      pathTitle={lp.model.name}
      model={lp.model}
      progress={lp.progress}
      levelProgress={lp.levelProgress}
      levelStatuses={lp.levelStatuses}
      priorDone={lp.priorState.done}
      outcomeUnlocked={lp.outcomeState.unlocked}
      onBackToPath={() => navigate(basePath)}
      onOpenLevel={(levelId) => navigate(`${basePath}/level/${levelId}`)}
      onOpenPrior={() => navigate(`${basePath}/prior`)}
    />
  );
}
