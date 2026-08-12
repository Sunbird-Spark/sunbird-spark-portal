import { FiHelpCircle, FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { CertificateLockCard } from './CertificateLockCard';
import type { LearningPathModel, LevelProgressInfo, LevelStatusKey, PathProgressInfo } from '@/types/learningPathTypes';

interface LearningPathRailProps {
  pathTitle: string;
  model: LearningPathModel;
  progress: PathProgressInfo;
  levelProgress: LevelProgressInfo[];
  levelStatuses: LevelStatusKey[];
  priorDone: boolean;
  outcomeUnlocked: boolean;
  onBackToPath: () => void;
  onOpenLevel: (levelId: string) => void;
  onOpenPrior: () => void;
}

/**
 * Player-chrome rail — path progress + path structure + certificate — rendered
 * inside `CollectionSidePanel` when a course is opened from within a Learning
 * Path (`?lp=`, see plan §5). Every other course-detail entry point is unaffected.
 */
export function LearningPathRail({
  pathTitle,
  model,
  progress,
  levelProgress,
  levelStatuses,
  priorDone,
  outcomeUnlocked,
  onBackToPath,
  onOpenLevel,
  onOpenPrior,
}: LearningPathRailProps) {
  const { t } = useAppI18n();

  return (
    <div className="flex flex-col gap-4" data-testid="learning-path-rail">
      <div className="rounded-xl border border-sunbird-gray-e5 bg-surface p-[1.125rem] shadow-sm">
        <button type="button" onClick={onBackToPath} className="mb-2.5 bg-transparent p-0 text-xs font-medium text-sunbird-brick">
          ← {pathTitle}
        </button>
        <div className="flex items-baseline justify-between gap-2.5">
          <span className="text-sm font-medium text-foreground">{t('learningPath.pathProgress')}</span>
          <span className="text-base font-medium text-sunbird-ink">{progress.pct}%</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-pill bg-sunbird-gray-e5">
          <div className="h-full rounded-pill bg-sunbird-brick" style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      <div className="rounded-xl border border-sunbird-gray-e5 bg-surface p-[1.125rem] shadow-sm">
        <span className="block text-sm font-medium text-foreground">{t('learningPath.level')}</span>
        {model.priorAssessment && (
          <div
            onClick={onOpenPrior}
            className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-sunbird-gray-e5 px-3 py-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sunbird-lavender text-white">
              <FiHelpCircle className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium text-foreground">{model.priorAssessment.name}</span>
              <span className="text-[0.6875rem] text-sunbird-gray-75">
                {priorDone ? t('learningPath.statusCompleted') : t('learningPath.statusInProgress')}
              </span>
            </div>
          </div>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {model.levels.map((level, i) => {
            const lp = levelProgress[i];
            const status = levelStatuses[i];
            const locked = status === 'locked';
            return (
              <div
                key={level.identifier}
                onClick={locked ? undefined : () => onOpenLevel(level.identifier)}
                className={`flex items-start gap-2.5 rounded-xl border border-sunbird-gray-e5 px-3 py-2.5 ${locked ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${locked ? 'bg-sunbird-gray-b2' : 'bg-sunbird-brick'}`}
                >
                  {(lp?.pct ?? 0) >= 100 ? '✓' : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium text-foreground">
                    {t('learningPath.levelOf', { num: i + 1 })} · {level.name}
                  </span>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-pill bg-sunbird-gray-e5">
                    <div className="h-full rounded-pill bg-sunbird-brick" style={{ width: `${lp?.pct ?? 0}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {model.outcomeAssessment && (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-dashed border-sunbird-gray-b2 px-3 py-2.5 opacity-75">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sunbird-jamun/10 text-sunbird-jamun">
              <FiAward className="h-3.5 w-3.5" />
            </div>
            <span className="text-[0.8125rem] font-medium text-foreground">
              {outcomeUnlocked ? t('learningPath.start') : t('learningPath.locked')}
            </span>
          </div>
        )}
      </div>

      <CertificateLockCard levelCount={model.levels.length} doneLevels={progress.doneLevels} unlocked={outcomeUnlocked && progress.pct >= 100} />
    </div>
  );
}
