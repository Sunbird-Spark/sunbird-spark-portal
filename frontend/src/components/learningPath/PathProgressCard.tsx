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

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-t border-sunbird-gray-e5 py-2.5 text-sm first:border-t-0">
      <span className="text-sunbird-gray-75">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/** The sticky "Path progress" rail (design's overview left column, Style B · Ledger). */
export function PathProgressCard({ progress, policy, courseTotal, scopeCount, batchEndDate }: PathProgressCardProps) {
  const { t } = useAppI18n();

  return (
    <div className="rounded-xl border border-sunbird-gray-e5 bg-surface p-5 shadow-sm" data-testid="path-progress-card">
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
      <div className="mt-4 flex flex-col">
        <StatRow label={t('learningPath.policy')} value={t(POLICY_LABEL_KEY[policy])} />
        <StatRow label={t('learningPath.levels')} value={progress.levelCount} />
        <StatRow label={t('learningPath.coursesLinked')} value={courseTotal} />
        <StatRow label={t('learningPath.skillsScoped')} value={scopeCount} />
        {batchEndDate && <StatRow label={t('learningPath.batchEnds')} value={batchEndDate} />}
      </div>
    </div>
  );
}
