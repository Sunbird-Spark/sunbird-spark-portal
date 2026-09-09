import { FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { SkillAggregate } from '@/services/learningPath/skillAggregation';

interface MySkillsHeroProps {
  aggregate: SkillAggregate;
  analyzedCount: number;
  totalCount: number;
}

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StatRow({ value, label, tone }: { value: number; label: string; tone?: 'gained' | 'pending' }) {
  const valueTone =
    tone === 'gained' ? 'text-sunbird-green-dark' : tone === 'pending' ? 'text-sunbird-gray-75' : 'text-sunbird-ink';
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs text-sunbird-gray-75">{label}</span>
      <span className={`text-base font-bold leading-none ${valueTone}`}>{value}</span>
    </div>
  );
}

/** The left rail's summary: one ring for overall attainment, then the breakdown. */
export function MySkillsHero({ aggregate, analyzedCount, totalCount }: MySkillsHeroProps) {
  const { t } = useAppI18n();
  const { totalSkills, gainedSkills, pendingSkills, pathsCompleted, pathsOngoing } = aggregate;

  const skillPct = totalSkills > 0 ? Math.round((gainedSkills / totalSkills) * 100) : 0;
  const allGained = totalSkills > 0 && gainedSkills === totalSkills;
  const isAnalyzing = totalCount > 0 && analyzedCount < totalCount;
  const analyzedPct = totalCount > 0 ? Math.round((analyzedCount / totalCount) * 100) : 100;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-sunbird-gray-e5 bg-surface shadow-sm"
      data-testid="my-skills-hero"
    >
      <div className={`px-5 pb-5 pt-6 text-center ${allGained ? 'bg-sunbird-success-message-bg' : 'bg-sunbird-ivory'}`}>
        <div className="relative mx-auto h-28 w-28">
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
            <span className="text-[1.625rem] font-bold leading-none text-sunbird-ink">{gainedSkills}</span>
            <span className="text-xs text-sunbird-gray-75">{t('learningPath.ofSkills', { total: totalSkills })}</span>
          </div>
        </div>

        {allGained ? (
          <div className="mt-3 flex animate-fade-in items-center justify-center gap-2 text-sunbird-green-dark">
            <FiAward className="h-4 w-4" />
            <span className="text-sm font-semibold">{t('mySkills.allSkillsGained')}</span>
          </div>
        ) : (
          <p className="mt-3 text-xs text-sunbird-gray-75">{t('mySkills.keepGoing')}</p>
        )}
      </div>

      <div className="divide-y divide-sunbird-gray-e5 px-5 py-2">
        <StatRow value={gainedSkills} label={t('mySkills.skillsGained')} tone="gained" />
        <StatRow value={pendingSkills} label={t('mySkills.skillsPending')} tone="pending" />
        <StatRow value={pathsCompleted} label={t('mySkills.pathsCompleted')} />
        <StatRow value={pathsOngoing} label={t('mySkills.pathsOngoing')} />
      </div>

      {isAnalyzing && (
        <div className="border-t border-sunbird-gray-e5 bg-sunbird-ivory px-5 py-3" data-testid="my-skills-analyzing">
          <div className="h-1.5 overflow-hidden rounded-pill bg-sunbird-gray-e5">
            <div
              className="h-full rounded-pill bg-sunbird-brick transition-all duration-500"
              style={{ width: `${analyzedPct}%` }}
            />
          </div>
          <span className="mt-1.5 block text-xs text-sunbird-gray-75">
            {t('mySkills.analyzedProgress', { done: analyzedCount, total: totalCount })}
          </span>
        </div>
      )}
    </div>
  );
}
