import { FiArrowRight, FiAward } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { PathProgressInfo } from '@/types/learningPathTypes';

interface StatusHeroProps {
  pathName: string;
  progress: PathProgressInfo;
  gainedCount: number;
  skillTotal: number;
  pathLink: string;
}

/** Ring dimensions in rem-derived px units; the SVG scales with the container. */
const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The status page's left rail: a progress ring, skill tally, and the way back into the path itself. */
export function StatusHero({ pathName, progress, gainedCount, skillTotal, pathLink }: StatusHeroProps) {
  const { t } = useAppI18n();
  const allGained = skillTotal > 0 && gainedCount === skillTotal;
  const skillPct = skillTotal > 0 ? Math.round((gainedCount / skillTotal) * 100) : 0;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-sunbird-gray-e5 bg-surface shadow-sm"
      data-testid="status-path-header-node"
    >
      <div className={`p-6 text-center ${allGained ? 'bg-sunbird-success-message-bg' : 'bg-sunbird-ivory'}`}>
        <div className="relative mx-auto h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="7" className="stroke-sunbird-gray-e5" />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - (skillPct / 100) * CIRCUMFERENCE}
              className={`transition-all duration-1000 ease-out ${
                allGained ? 'stroke-sunbird-success-message' : 'stroke-sunbird-brick'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[1.75rem] font-bold leading-none text-sunbird-ink">{gainedCount}</span>
            <span className="text-xs text-sunbird-gray-75">
              {t('learningPath.ofSkills', { total: skillTotal })}
            </span>
          </div>
        </div>

        {allGained ? (
          <div className="mt-4 flex animate-fade-in items-center justify-center gap-2 text-sunbird-green-dark">
            <FiAward className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('learningPath.allSkillsGained')}</span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-sunbird-gray-75">{t('learningPath.keepGoing')}</p>
        )}
      </div>

      <div className="p-5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-sunbird-gray-75">
          {t('learningPath.statusTitle')}
        </span>
        <h1 className="mt-1 text-lg font-bold leading-snug text-foreground">{pathName}</h1>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-sunbird-gray-e5">
            <div
              className="h-full rounded-pill bg-sunbird-brick transition-all duration-700"
              style={{ width: `${progress.pct}%` }}
              role="progressbar"
              aria-valuenow={progress.pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-sunbird-gray-75">{progress.pct}%</span>
        </div>
        <span className="mt-1.5 block text-xs text-sunbird-gray-75">
          {t('learningPath.levelsCompletedCount', { done: progress.doneLevels, total: progress.levelCount })}
        </span>

        <Link
          to={pathLink}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-sunbird-brick px-4 py-2.5 text-sm font-medium text-sunbird-brick transition-colors hover:bg-sunbird-brick hover:text-white"
          data-testid="status-open-path-link"
        >
          {t('learningPath.goToLearningPath')}
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
