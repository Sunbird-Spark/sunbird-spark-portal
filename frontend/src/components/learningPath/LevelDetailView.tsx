import { useAppI18n } from '@/hooks/useAppI18n';
import { LevelStatusBadge } from './LevelStatusBadge';
import { LedgerCourseRow } from './LedgerCourseRow';
import { LevelSkillsCard } from './LevelSkillsCard';
import { WaiverNote } from './WaiverNote';
import { computeCourseProgress } from '@/services/learningPath/learningPathProgress';
import type { LPLevelNode, LevelProgressInfo, LevelStatusKey } from '@/types/learningPathTypes';
import type { ViewerSummaryRecord } from '@/types/viewerServiceTypes';

interface LevelDetailViewProps {
  level: LPLevelNode;
  levelNumber: number;
  progress: LevelProgressInfo;
  status: LevelStatusKey;
  waiverNote?: string;
  summaryByCollectionId: Map<string, ViewerSummaryRecord>;
  pathSummary?: ViewerSummaryRecord;
  onBack: () => void;
  onOpenCourse: (courseId: string, contentId: string) => void;
}

/** Level detail screen: back link, badge, three-up stats strip, course list, skills rail (design's `bLevel`). */
export function LevelDetailView({
  level,
  levelNumber,
  progress,
  status,
  waiverNote,
  summaryByCollectionId,
  pathSummary,
  onBack,
  onOpenCourse,
}: LevelDetailViewProps) {
  const { t } = useAppI18n();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="overflow-hidden rounded-xl border border-sunbird-gray-e5 bg-surface shadow-sm">
        <div className="border-b border-sunbird-gray-e5 p-6">
          <button type="button" onClick={onBack} className="mb-3 bg-transparent p-0 text-sm font-medium text-sunbird-brick">
            ← {t('learningPath.backToPath')}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              {t('learningPath.levelOf', { num: levelNumber })} · {level.name}
            </h2>
            <LevelStatusBadge status={status} />
          </div>
          {level.description && <p className="mt-2 text-sm leading-relaxed text-sunbird-gray-4a">{level.description}</p>}
        </div>
        <div className="grid grid-cols-3 divide-x divide-sunbird-gray-e5 border-b border-sunbird-gray-e5">
          <div className="p-4">
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.courses')}
            </span>
            <span className="text-base font-medium text-foreground">{level.courses.length}</span>
          </div>
          <div className="p-4">
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.requiredToPass')}
            </span>
            <span className="text-base font-medium text-foreground">{t('learningPath.allCourses')}</span>
          </div>
          <div className="p-4">
            <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
              {t('learningPath.levelProgress')}
            </span>
            <span className="text-base font-medium text-foreground">{progress.pct}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-6">
          {level.courses.map((course) => (
            <LedgerCourseRow
              key={course.identifier}
              course={course}
              progress={computeCourseProgress(course, summaryByCollectionId, pathSummary)}
              onOpen={() => onOpenCourse(course.identifier, course.leafIds[0] ?? '')}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <LevelSkillsCard skills={level.skills} />
        {waiverNote && <WaiverNote note={waiverNote} />}
      </div>
    </div>
  );
}
