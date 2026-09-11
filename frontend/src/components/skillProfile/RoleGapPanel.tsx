import type { ReactNode } from 'react';
import { FiBriefcase, FiTarget } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { skillName, type SkillVocabulary } from '@/services/skill';
import type { RoleGap } from '@/types/skillServiceTypes';

interface RoleGapPanelProps {
  /** The role the learner holds. Undefined until an HR feed assigns one. */
  current?: RoleGap;
  /** The role they are aiming at. */
  target?: RoleGap;
  roleName: (code: string) => string;
  vocabulary: SkillVocabulary | undefined;
}

/**
 * Readiness against the current role and the target, side by side.
 *
 * BOTH, because they answer different questions: the current role says whether the learner
 * can do the job they hold, the target says how far the next one is. The service returns
 * both for exactly this reason, and showing only one forces the reader to guess which.
 *
 * Current role is read-only - it is an assignment from an HR feed, and the self-service
 * route strips it - so there is no control here, only a statement of fact or its absence.
 */
export function RoleGapPanel({ current, target, roleName, vocabulary }: RoleGapPanelProps) {
  const { t } = useAppI18n();

  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid="role-gap-panel">
      <GapColumn
        icon={<FiBriefcase className="h-4 w-4" />}
        label={t('skillProfile.currentRole')}
        emptyLabel={t('skillProfile.currentRoleUnset')}
        gap={current}
        roleName={roleName}
        vocabulary={vocabulary}
        testId="gap-current"
      />
      <GapColumn
        icon={<FiTarget className="h-4 w-4" />}
        label={t('skillProfile.targetRole')}
        emptyLabel={t('skillProfile.targetRoleUnset')}
        gap={target}
        roleName={roleName}
        vocabulary={vocabulary}
        testId="gap-target"
      />
    </div>
  );
}

function GapColumn({
  icon,
  label,
  emptyLabel,
  gap,
  roleName,
  vocabulary,
  testId,
}: {
  icon: ReactNode;
  label: string;
  emptyLabel: string;
  gap?: RoleGap;
  roleName: (code: string) => string;
  vocabulary: SkillVocabulary | undefined;
  testId: string;
}) {
  const { t } = useAppI18n();
  const complete = gap?.readiness === 100;

  return (
    <div className="rounded-xl border border-sunbird-gray-e5 bg-surface p-4" data-testid={testId}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunbird-ivory text-sunbird-gray-75">
          {icon}
        </span>
        <span className="text-xs font-medium text-sunbird-gray-75">{label}</span>
      </div>

      {!gap ? (
        // No role on record. NOT "0% ready" - that would tell a fully qualified learner
        // they are unqualified.
        <p className="mt-2 text-sm text-sunbird-gray-75" data-testid={`${testId}-unset`}>
          {emptyLabel}
        </p>
      ) : (
        <>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">{roleName(gap.role)}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-lg font-bold ${complete ? 'text-sunbird-green-dark' : 'text-sunbird-ink'}`}>
              {gap.readiness}%
            </span>
            <span className="text-xs text-sunbird-gray-75">
              {t('skillProfile.metOf', { met: gap.met, required: gap.required })}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sunbird-gray-e5">
            <div
              className={`h-full rounded-full transition-all ${complete ? 'bg-sunbird-success-message' : 'bg-sunbird-brick'}`}
              style={{ width: `${Math.min(100, Math.max(0, gap.readiness))}%` }}
            />
          </div>
          {gap.outstanding.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-sunbird-gray-75">{t('skillProfile.stillNeeded')}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5" data-testid={`${testId}-outstanding`}>
                {gap.outstanding.map((code) => (
                  <li
                    key={code}
                    className="rounded-full bg-sunbird-ivory px-2 py-0.5 text-xs text-sunbird-gray-75"
                  >
                    {skillName(vocabulary, code)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
