import { useMemo, useState } from 'react';
import { FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import useImpression from '@/hooks/useImpression';
import PageLoader from '@/components/common/PageLoader';
import { RoleGapPanel } from '@/components/skillProfile/RoleGapPanel';
import { RolePicker } from '@/components/skillProfile/RolePicker';
import { TierGroup } from '@/components/skillProfile/TierGroup';
import { NextStepsList } from '@/components/skillProfile/NextStepsList';
import {
  useSkillProfile,
  useSkillGap,
  useSkillRecommend,
  useSkillFrameworks,
  useSaveTargetRole,
} from '@/hooks/useSkillProfile';
import { groupSkillsByTier, isGrouped, skillName } from '@/services/skill';

/**
 * The learner's skill profile: what they hold, how ready they are for the role they hold
 * and the one they are aiming at, and what to do next.
 *
 * THE MODEL IS BINARY - a skill is held or not. Everything level-shaped belongs to the
 * superseded v1 model and is deliberately absent.
 *
 * ONE FRAMEWORK AT A TIME. A learner can hold skills from several, but a gap is only
 * meaningful within one framework's role definitions, so the page works against the
 * framework with the most held skills and switches on demand.
 */
const SkillProfile = () => {
  const { t } = useAppI18n();
  useImpression({ type: 'view', pageid: 'skill-profile', env: 'profile' });

  const { skills, frameworkIds, isLoading, isError, refetch } = useSkillProfile();
  const { metas, vocabularies } = useSkillFrameworks(frameworkIds);

  // Most-held framework leads; the learner can switch if they hold more than one.
  const defaultFramework = useMemo(() => {
    const counts = new Map<string, number>();
    skills.forEach((s) => counts.set(s.frameworkId, (counts.get(s.frameworkId) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  }, [skills]);

  const [framework, setFramework] = useState<string>();
  const activeFramework = framework ?? defaultFramework;

  const [target, setTarget] = useState<string>();
  const { gap } = useSkillGap(activeFramework, target);
  const { recommendation } = useSkillRecommend(activeFramework, target ?? gap?.targets[0]?.role);
  const saveTarget = useSaveTargetRole(activeFramework);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vocab = activeFramework ? vocabularies[activeFramework] : undefined;
  const meta = activeFramework ? metas[activeFramework] : undefined;
  const name = (code: string) => skillName(vocab, code);

  const frameworkSkills = useMemo(
    () => skills.filter((s) => s.frameworkId === activeFramework),
    [skills, activeFramework]
  );
  const groups = useMemo(() => groupSkillsByTier(frameworkSkills, vocab), [frameworkSkills, vocab]);
  const grouped = isGrouped(groups);
  // tierLabels[0] names the tier the grouping keys on.
  const tierLabel = meta?.tierLabels?.[0];

  const chooseTarget = (role: string) => {
    setTarget(role);
    saveTarget.mutate(role);
  };

  if (isLoading) return <PageLoader />;
  // An unreachable API and an empty profile look identical unless the error is surfaced.
  if (isError) return <PageLoader error={t('somethingWentWrong')} onRetry={() => void refetch()} />;

  const targetGap = target ? gap?.current ?? gap?.targets[0] : gap?.targets[0];

  return (
    <div className="flex-1 min-w-0 mx-auto max-w-[85rem] px-6 py-7">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <FiAward className="h-6 w-6 text-sunbird-brick" />
          {t('skillProfile.title')}
        </h1>
        <p className="mt-1 text-sm text-sunbird-gray-75">{t('skillProfile.subtitle')}</p>
      </header>

      {skills.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-sunbird-gray-d0 p-8 text-center"
          data-testid="skill-profile-empty"
        >
          <p className="text-sm font-medium text-foreground">{t('skillProfile.emptyTitle')}</p>
          <p className="mt-1 text-sm text-sunbird-gray-75">{t('skillProfile.emptyBody')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {frameworkIds.length > 1 && (
            <RolePicker
              roles={frameworkIds}
              {...(activeFramework ? { selected: activeFramework } : {})}
              roleName={(code) => skillName(vocabularies[code], code)}
              onSelect={setFramework}
            />
          )}

          <RoleGapPanel
            {...(gap?.current ? { current: gap.current } : {})}
            {...(targetGap ? { target: targetGap } : {})}
            roleName={name}
            vocabulary={vocab}
          />

          <RolePicker
            roles={meta?.roleCodes ?? []}
            {...(target ?? targetGap?.role ? { selected: target ?? targetGap?.role } : {})}
            roleName={name}
            onSelect={chooseTarget}
          />

          {recommendation && recommendation.candidates.length > 0 && (
            <NextStepsList candidates={recommendation.candidates} roleName={name(recommendation.role)} />
          )}

          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">{t('skillProfile.skillsHeld')}</h2>
              {grouped && tierLabel && <span className="text-xs text-sunbird-gray-75">{tierLabel}</span>}
            </div>
            {groups.map((group) => (
              <TierGroup
                key={group.tierCode || 'unclassified'}
                group={group}
                showHeading={grouped}
                vocabulary={vocab}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillProfile;
