import { Link } from 'react-router-dom';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { PathSkill, PathSkillSummary } from '@/services/learningPath/pathSkillStatus';

interface PathSkillProgressCardProps {
  summary: PathSkillSummary;
  name: (code: string) => string;
  roleName: string;
  hasRole: boolean;
}

const DOT: Record<PathSkill['state'], string> = {
  held: 'bg-sunbird-green',
  inProgress: 'bg-sunbird-brick',
  notStarted: 'bg-sunbird-gray-e5',
};

/**
 * "How much closer am I?" for a learner partway through a path.
 *
 * This replaces a bare skills COUNT, which read identically on day one and day thirty. The three
 * states come from `computePathSkills` and are derived, never stored - the evidence model stays
 * binary (see pathSkillStatus.ts).
 *
 * Ordered held -> in progress -> not started: a learner scanning this wants "what have I got" first
 * and "what is left" last, and the ordering doubles as the progress story.
 */
export function PathSkillProgressCard({ summary, name, roleName, hasRole }: PathSkillProgressCardProps) {
  const { t } = useAppI18n();
  const order: Record<PathSkill['state'], number> = { held: 0, inProgress: 1, notStarted: 2 };
  const skills = [...summary.skills].sort(
    (a, b) => order[a.state] - order[b.state] || name(a.code).localeCompare(name(b.code))
  );

  return (
    <div
      className="rounded-xl border border-sunbird-gray-e5 bg-surface p-5 shadow-sm"
      data-testid="path-skill-progress"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          {hasRole
            ? t('learningPath.progressTowardRole', { role: roleName })
            : t('learningPath.skillsFromThisPath')}
        </span>
        <span className="text-xs text-sunbird-gray-75" data-testid="path-skill-count">
          {t('learningPath.skillsHeldOf', { held: summary.held, total: summary.required })}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunbird-gray-e5">
          <div
            className="h-full rounded-full bg-sunbird-green transition-[width] duration-500"
            style={{ width: `${summary.readiness ?? 0}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-foreground" data-testid="path-skill-readiness">
          {summary.readiness ?? 0}%
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {skills.map((s) => (
          <li key={s.code} className="flex items-center gap-2 text-sm" data-testid={`path-skill-${s.code}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[s.state]}`} aria-hidden="true" />
            <span className={s.state === 'held' ? 'text-foreground' : 'text-sunbird-gray-75'}>
              {name(s.code)}
            </span>
            {s.state === 'inProgress' && (
              <span className="text-[0.6875rem] text-sunbird-brick">{s.percent}%</span>
            )}
            {/* The role needs it but nothing on this path teaches it - finishing here is not enough. */}
            {s.notTaught && (
              <span className="text-[0.6875rem] text-sunbird-gray-82">
                {t('learningPath.notOnThisPath')}
              </span>
            )}
          </li>
        ))}
      </ul>

      <Link
        to="/profile/competencies"
        className="mt-4 inline-block text-xs font-medium text-sunbird-brick hover:underline"
      >
        {t('learningPath.viewFullProfile')}
      </Link>
    </div>
  );
}
