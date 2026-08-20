import { FiInfo } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/common/Popover';
import type { LearningPathPolicy, PathProgressInfo } from '@/types/learningPathTypes';

const POLICY_LABEL_KEY: Record<LearningPathPolicy, string> = {
  Fixed: 'learningPath.policyStrict',
  Diagnostic: 'learningPath.policyAdaptive',
  PriorLearning: 'learningPath.policyPriorLearning',
};

// Moved from the old, always-visible `PolicyNoteBanner` (now deleted) - the
// explainer is now a click-to-reveal popover next to the Policy stat instead.
const POLICY_NOTE_KEY: Record<LearningPathPolicy, string> = {
  Fixed: 'learningPath.policyNoteStrict',
  Diagnostic: 'learningPath.policyNoteAdaptive',
  PriorLearning: 'learningPath.policyNotePriorLearning',
};

interface PathProgressCardProps {
  progress: PathProgressInfo;
  policy: LearningPathPolicy;
  courseTotal: number;
  scopeCount: number;
  batchEndDate?: string;
}

interface StatColumnProps {
  label: string;
  value: string | number;
  /** When provided (with `infoContent`), shows a click-to-reveal info icon next to the label. */
  infoLabel?: string;
  infoContent?: string;
  testId?: string;
}

/** A single stat, optionally with a click-to-reveal info popover explaining what it means. */
function StatColumn({ label, value, infoLabel, infoContent, testId }: StatColumnProps) {
  const hasInfo = !!infoLabel && !!infoContent;
  return (
    <div className="flex flex-col gap-1 text-sm" data-testid="path-progress-stat">
      <span className="flex items-center gap-1 text-sunbird-gray-75">
        {label}
        {hasInfo && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={infoLabel}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-sunbird-gray-75 hover:text-sunbird-brick"
                data-testid={`${testId}-info-trigger`}
              >
                <FiInfo className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm leading-relaxed" data-testid={`${testId}-info-popover`}>
              {infoContent}
            </PopoverContent>
          </Popover>
        )}
      </span>
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
        <StatColumn
          label={t('learningPath.policy')}
          value={t(POLICY_LABEL_KEY[policy])}
          infoLabel={t('learningPath.policyInfoLabel')}
          infoContent={t(POLICY_NOTE_KEY[policy])}
          testId="policy"
        />
        <StatColumn
          label={t('learningPath.levels')}
          value={progress.levelCount}
          infoLabel={t('learningPath.levelsInfoLabel')}
          infoContent={t('learningPath.levelsNote')}
          testId="levels"
        />
        <StatColumn
          label={t('learningPath.coursesLinked')}
          value={courseTotal}
          infoLabel={t('learningPath.coursesLinkedInfoLabel')}
          infoContent={t('learningPath.coursesLinkedNote')}
          testId="courses-linked"
        />
        <StatColumn
          label={t('learningPath.skillsScoped')}
          value={scopeCount}
          infoLabel={t('learningPath.skillsScopedInfoLabel')}
          infoContent={t('learningPath.skillsScopedNote')}
          testId="skills-scoped"
        />
        {batchEndDate && <StatColumn label={t('learningPath.batchEnds')} value={batchEndDate} />}
      </div>
    </div>
  );
}
