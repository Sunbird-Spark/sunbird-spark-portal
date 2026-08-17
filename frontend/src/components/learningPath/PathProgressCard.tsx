import { useAppI18n } from '@/hooks/useAppI18n';
import type { LearningPathPolicy, PathProgressInfo } from '@/types/learningPathTypes';

const POLICY_LABEL_KEY: Record<LearningPathPolicy, string> = {
  Fixed: 'learningPath.policyStrict',
  Diagnostic: 'learningPath.policyAdaptive',
  PriorLearning: 'learningPath.policyPriorLearning',
};

interface PathProgressCardProps {
  progress: PathProgressInfo;
  policy: LearningPathPolicy;
  courseTotal: number;
  scopeCount: number;
  batchEndDate?: string;
}

function StatColumn({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 text-sm" data-testid="path-progress-stat">
      <span className="text-sunbird-gray-75">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * The "Path progress" banner (overview top section, Style B · Ledger): a
 * horizontal card at `lg:` — completion on the left, a divider, then Policy /
 * Levels / Courses linked / Skills scoped as a row of stat columns on the
 * right. Collapses to a single stacked column below `lg:`.
 */
export function PathProgressCard({ progress, policy, courseTotal, scopeCount, batchEndDate }: PathProgressCardProps) {
  const { t } = useAppI18n();

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-sunbird-gray-e5 bg-surface p-5 shadow-sm lg:flex-row lg:items-center lg:gap-6"
      data-testid="path-progress-card"
    >
      <div className="lg:w-72 lg:shrink-0">
        <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
          {t('learningPath.pathProgress')}
        </span>
        <div className="mt-2.5 mb-2 flex items-baseline gap-2">
          <span className="text-[2rem] font-bold leading-none text-sunbird-ink">{progress.pct}%</span>
          <span className="text-sm text-sunbird-gray-75">
            {progress.doneLevels}/{progress.levelCount} {t('learningPath.levels')}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-sunbird-gray-e5">
          <div
            className="h-full rounded-pill bg-sunbird-brick transition-all"
            style={{ width: `${progress.pct}%` }}
            role="progressbar"
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <div className="hidden w-px self-stretch bg-sunbird-gray-e5 lg:block" aria-hidden="true" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:flex-1 lg:flex-wrap lg:gap-8">
        <StatColumn label={t('learningPath.policy')} value={t(POLICY_LABEL_KEY[policy])} />
        <StatColumn label={t('learningPath.levels')} value={progress.levelCount} />
        <StatColumn label={t('learningPath.coursesLinked')} value={courseTotal} />
        <StatColumn label={t('learningPath.skillsScoped')} value={scopeCount} />
        {batchEndDate && <StatColumn label={t('learningPath.batchEnds')} value={batchEndDate} />}
      </div>
    </div>
  );
}
