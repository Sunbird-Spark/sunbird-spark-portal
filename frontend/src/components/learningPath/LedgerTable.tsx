import { useState } from 'react';
import { FiHelpCircle, FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Badge } from '@/components/ui/badge';
import { LedgerLevelRow } from './LedgerLevelRow';
import type { LearningPathModel, LevelProgressInfo, LevelStatusKey, ProgressInfo } from '@/types/learningPathTypes';
import type { ViewerSummaryRecord } from '@/types/viewerServiceTypes';

interface LedgerTableProps {
  model: LearningPathModel;
  levelProgress: LevelProgressInfo[];
  levelStatuses: LevelStatusKey[];
  priorProgress: (ProgressInfo & { status: 'completed' | 'active' | 'notStarted' }) | null;
  priorDone: boolean;
  outcomeUnlocked: boolean;
  outcomeProgress?: (ProgressInfo & { status: 'completed' | 'active' | 'notStarted' }) | null;
  summaryByCollectionId: Map<string, ViewerSummaryRecord>;
  pathSummary?: ViewerSummaryRecord;
  onOpenLevel: (levelId: string) => void;
  onOpenPrior: () => void;
  /** Opens the outcome assessment. Only reachable once `outcomeUnlocked` is true. */
  onOpenOutcome?: () => void;
  onOpenCourse: (courseId: string, contentId: string) => void;
}

const HEADER_CLASS =
  'grid grid-cols-[2.375rem_1fr_10rem_8.25rem_6.75rem] gap-3.5 bg-sunbird-ivory px-[1.125rem] py-3 text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75';

/** The Ledger table: pinned Prior row, expandable content Levels, pinned Outcome row (Style B design). */
export function LedgerTable({
  model,
  levelProgress,
  levelStatuses,
  priorProgress,
  priorDone,
  outcomeUnlocked,
  outcomeProgress,
  summaryByCollectionId,
  pathSummary,
  onOpenLevel,
  onOpenPrior,
  onOpenOutcome,
  onOpenCourse,
}: LedgerTableProps) {
  const { t } = useAppI18n();
  const [openLevelId, setOpenLevelId] = useState<string | null>(model.levels[0]?.identifier ?? null);

  return (
    <div className="overflow-hidden rounded-xl border border-sunbird-gray-e5 bg-surface shadow-sm">
      <div className={HEADER_CLASS}>
        <span />
        <span>{t('learningPath.level')}</span>
        <span>{t('learningPath.skills')}</span>
        <span>{t('learningPath.levelProgress')}</span>
        <span className="text-right">{t('learningPath.status')}</span>
      </div>

      {model.priorAssessment && (
        <div
          onClick={onOpenPrior}
          className="grid cursor-pointer grid-cols-[2.375rem_1fr_10rem_8.25rem_6.75rem] items-center gap-3.5 border-t border-sunbird-gray-e5 bg-sunbird-lavender/5 px-[1.125rem] py-3.5"
          data-testid="ledger-prior-row"
        >
          <div className="flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-lg bg-sunbird-lavender/15 text-sunbird-lavender">
            <FiHelpCircle className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-sm font-medium text-foreground">{model.priorAssessment.name}</span>
            <span className="text-xs text-sunbird-gray-75">{t('learningPath.priorAssessmentSub')}</span>
          </div>
          <span className="text-xs text-sunbird-gray-75">{t('learningPath.definesTheScope')}</span>
          <span className="text-sm font-medium text-sunbird-ink">
            {priorProgress ? `${priorProgress.completed}/${priorProgress.total}` : '—'}
          </span>
          <span className="text-right">
            <Badge variant={priorDone ? 'default' : 'outline'}>
              {priorDone ? t('learningPath.statusCompleted') : t('learningPath.statusInProgress')}
            </Badge>
          </span>
        </div>
      )}

      {model.levels.map((level, i) => (
        <LedgerLevelRow
          key={level.identifier}
          level={level}
          levelNumber={i + 1}
          progress={levelProgress[i] ?? { pct: 0, completed: 0, total: 0, doneCourses: 0 }}
          status={levelStatuses[i] ?? 'locked'}
          expanded={openLevelId === level.identifier}
          summaryByCollectionId={summaryByCollectionId}
          pathSummary={pathSummary}
          onToggle={() => setOpenLevelId((prev) => (prev === level.identifier ? null : level.identifier))}
          onOpenLevel={() => onOpenLevel(level.identifier)}
          onOpenCourse={onOpenCourse}
        />
      ))}

      {model.outcomeAssessment && (
        // Unlike the prior row, this one is only interactive once every content
        // Level is complete - before that the badge reads "Locked" and clicking
        // it must do nothing.
        <div
          onClick={outcomeUnlocked ? onOpenOutcome : undefined}
          role={outcomeUnlocked && onOpenOutcome ? 'button' : undefined}
          tabIndex={outcomeUnlocked && onOpenOutcome ? 0 : undefined}
          onKeyDown={(e) => outcomeUnlocked && e.key === 'Enter' && onOpenOutcome?.()}
          className={`grid grid-cols-[2.375rem_1fr_10rem_8.25rem_6.75rem] items-center gap-3.5 border-t border-sunbird-gray-e5 bg-sunbird-jamun/5 px-[1.125rem] py-3.5 ${
            outcomeUnlocked && onOpenOutcome ? 'cursor-pointer' : 'opacity-90'
          }`}
          data-testid="ledger-outcome-row"
        >
          <div className="flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-lg bg-sunbird-jamun/10 text-sunbird-jamun">
            <FiAward className="h-[0.9375rem] w-[0.9375rem]" />
          </div>
          <div>
            <span className="block text-sm font-medium text-foreground">{model.outcomeAssessment.name}</span>
            <span className="text-xs text-sunbird-gray-75">{t('learningPath.outcomeAssessmentSub')}</span>
          </div>
          <span className="text-xs text-sunbird-gray-75">{t('learningPath.allScopedSkills')}</span>
          <span className="text-sm font-medium text-sunbird-ink">
            {outcomeProgress ? `${outcomeProgress.completed}/${outcomeProgress.total}` : '—'}
          </span>
          <span className="text-right">
            <Badge variant={outcomeProgress?.status === 'completed' ? 'default' : 'outline'}>
              {outcomeProgress?.status === 'completed'
                ? t('learningPath.statusCompleted')
                : outcomeUnlocked
                  ? t('learningPath.start')
                  : t('learningPath.locked')}
            </Badge>
          </span>
        </div>
      )}
    </div>
  );
}
