import { useState } from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from '@/components/common/Button';
import { useSkillFrameworks, useAssignRole } from '@/hooks/useSkillProfile';

interface CompetencyRoleTabProps {
  /** Frameworks an admin may assign against. */
  frameworkIds: string[];
}

/**
 * Assigns a learner's CURRENT competency role.
 *
 * NOT the same "role" as the Change User Roles tab next door. That one sets PLATFORM PERMISSIONS
 * (ORG_ADMIN, CONTENT_CREATOR); this sets the JOB ROLE a learner is measured against - Staff Nurse
 * (ICU), Nursing Officer. Two unrelated concepts one click apart, so the wording here is explicit.
 *
 * Current role is deliberately admin-only: it states what someone is accountable for today, and an
 * organisation cannot report "42% of our ICU nurses are ready" if nurses declare it themselves. A
 * learner's TARGET role stays theirs to choose, and is left untouched by this.
 */
export function CompetencyRoleTab({ frameworkIds }: CompetencyRoleTabProps) {
  const { t } = useAppI18n();
  const [userId, setUserId] = useState('');
  const [framework, setFramework] = useState(frameworkIds[0] ?? '');
  const [role, setRole] = useState('');
  const { metas } = useSkillFrameworks(framework ? [framework] : []);
  const assign = useAssignRole();

  const meta = metas[framework];
  const roles = meta?.roleCodes ?? [];
  const roleName = (code: string) => meta?.roleNames?.[code] ?? code;
  const canSubmit = Boolean(userId.trim() && framework && role) && !assign.isPending;

  return (
    <div className="flex flex-col gap-4" data-testid="competency-role-tab">
      <p className="text-sm text-sunbird-gray-75">{t('userManagement.competencyRole.intro')}</p>

      <label className="flex flex-col gap-1 text-sm">
        {t('userManagement.competencyRole.userId')}
        <input
          className="rounded-lg border border-sunbird-gray-e5 bg-surface px-3 py-2"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder={t('userManagement.competencyRole.userIdPlaceholder')}
          data-testid="competency-role-user"
        />
      </label>

      {frameworkIds.length > 1 && (
        <label className="flex flex-col gap-1 text-sm">
          {t('userManagement.competencyRole.framework')}
          <select
            className="rounded-lg border border-sunbird-gray-e5 bg-surface px-3 py-2"
            value={framework}
            onChange={(e) => {
              setFramework(e.target.value);
              setRole('');
            }}
            data-testid="competency-role-framework"
          >
            {frameworkIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {t('userManagement.competencyRole.role')}
        <select
          className="rounded-lg border border-sunbird-gray-e5 bg-surface px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          data-testid="competency-role-select"
        >
          <option value="">{t('userManagement.competencyRole.choose')}</option>
          {roles.map((code) => (
            <option key={code} value={code}>{roleName(code)}</option>
          ))}
        </select>
      </label>

      <div>
        <Button
          disabled={!canSubmit}
          onClick={() => assign.mutate({ userId: userId.trim(), frameworkId: framework, role })}
          data-testid="competency-role-assign"
        >
          {assign.isPending
            ? t('userManagement.competencyRole.assigning')
            : t('userManagement.competencyRole.assign')}
        </Button>
      </div>

      {assign.isSuccess && (
        <p className="text-sm text-sunbird-green" data-testid="competency-role-done">
          {t('userManagement.competencyRole.assigned', { role: roleName(role) })}
        </p>
      )}
      {assign.isError && (
        <p className="text-sm text-sunbird-brick" data-testid="competency-role-error">
          {t('userManagement.competencyRole.failed')}
        </p>
      )}
    </div>
  );
}
