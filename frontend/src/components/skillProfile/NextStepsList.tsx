import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { isLearningPathCategory } from '@/utils/isLearningPath';
import type { RankedCandidate } from '@/types/skillServiceTypes';

interface NextStepsListProps {
  candidates: RankedCandidate[];
  roleName: string;
}

/**
 * The courses and paths that close the learner's gap, best first.
 *
 * ORDER IS THE SERVICE'S, not re-sorted here. The ranking weighs gap closed against effort
 * after waiving, and the client cannot see what waiving applies - re-sorting on
 * `gapCovered` alone would quietly contradict it.
 *
 * This is the payoff of the whole design: the next action is derived, not browsed.
 */
export function NextStepsList({ candidates, roleName }: NextStepsListProps) {
  const { t } = useAppI18n();
  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3" data-testid="next-steps">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{t('skillProfile.nextSteps')}</h2>
        <span className="text-xs text-sunbird-gray-75">{t('skillProfile.nextStepsFor', { role: roleName })}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {candidates.map((c) => (
          <li key={c.identifier}>
            <Link
              to={isLearningPathCategory(c.primaryCategory) ? `/learning-path/${c.identifier}` : `/collection/${c.identifier}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-sunbird-gray-e5 bg-surface p-4 transition-colors hover:bg-sunbird-ivory"
              data-testid={`next-step-${c.identifier}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunbird-ivory text-sunbird-brick">
                  <FiBookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-sunbird-gray-75">
                    {t('skillProfile.covers', { covered: c.gapCovered, total: c.totalSkills })}
                    {c.alreadyHeld > 0 ? ` · ${t('skillProfile.alreadyHeld', { count: c.alreadyHeld })}` : ''}
                  </p>
                </div>
              </div>
              <FiArrowRight className="h-4 w-4 shrink-0 text-sunbird-brick" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
