import { useMemo, useState } from 'react';
import { FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import useImpression from '@/hooks/useImpression';
import PageLoader from '@/components/common/PageLoader';
import { PassbookHero } from '@/components/passbook/PassbookHero';
import { PositionPicker } from '@/components/passbook/PositionPicker';
import { CompetencyCard } from '@/components/passbook/CompetencyCard';
import { GapTable } from '@/components/passbook/GapTable';
import { usePassbook, useCompetencyLabels, labelFor as resolveLabel } from '@/hooks/usePassbook';
import { useCompetencyFramework, useCompetencyGap, useSaveTargetPosition } from '@/hooks/useCompetencyGap';
import { isHeld } from '@/services/competency';

/**
 * The learner's competency passbook, and readiness against a target position.
 *
 * WHY THE POSITION IS CHOSEN HERE rather than read from the learner's record:
 * `user_competency_position` is written only by an HR feed or the privileged
 * position API, so for most learners it is empty - and `gap/read` reports that
 * as `readiness: 0`, which must not be shown as a score. Letting the learner
 * pick a target makes the comparison meaningful today, and the choice is saved
 * back as `targetPositions` (the one field the public route accepts).
 */
const Passbook = () => {
  const { t } = useAppI18n();
  useImpression({ type: 'view', pageid: 'competency-passbook', env: 'profile' });

  const { entries, frameworkId, isLoading, isError, refetch } = usePassbook();
  const labels = useCompetencyLabels(frameworkId);
  const label = (code: string) => resolveLabel(labels, code);

  const { meta } = useCompetencyFramework(frameworkId);
  const [position, setPosition] = useState<string>();
  const { gap } = useCompetencyGap(frameworkId, position);
  const saveTarget = useSaveTargetPosition(frameworkId);

  const [expanded, setExpanded] = useState<string | null>(null);

  const heldCount = useMemo(() => entries.filter(isHeld).length, [entries]);
  // Criticality is only worth a column when the framework actually varies it -
  // a framework that declares none makes every requirement mandatory, and
  // labelling them all "Mandatory" implies a distinction that does not exist.
  const showCriticality = useMemo(() => {
    const values = new Set((gap?.rows ?? []).map((r) => r.criticality).filter(Boolean));
    return values.size > 1;
  }, [gap]);

  const choosePosition = (code: string) => {
    setPosition(code);
    saveTarget.mutate(code);
  };

  if (isLoading) return <PageLoader />;
  // An unreachable API and an empty passbook look identical unless the error is
  // surfaced, so this shows retry rather than "no competencies yet".
  if (isError) return <PageLoader error={t('somethingWentWrong')} onRetry={() => void refetch()} />;

  return (
    <div className="flex-1 min-w-0 mx-auto max-w-[85rem] px-6 py-7">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <FiAward className="h-6 w-6 text-sunbird-brick" />
          {t('passbook.title')}
        </h1>
        <p className="mt-1 text-sm text-sunbird-gray-75">{t('passbook.subtitle')}</p>
      </header>

      {entries.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-sunbird-gray-d0 p-8 text-center"
          data-testid="passbook-empty"
        >
          <p className="text-sm font-medium text-foreground">{t('passbook.emptyTitle')}</p>
          <p className="mt-1 text-sm text-sunbird-gray-75">{t('passbook.emptyBody')}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className="flex flex-col gap-4">
            <PassbookHero
              heldCount={heldCount}
              totalCount={entries.length}
              {...(gap?.resolved ? { readiness: gap.readiness, outstanding: gap.mandatoryOutstanding } : {})}
              {...(position ? { positionLabel: label(position) } : {})}
            />
            <PositionPicker
              positions={meta?.positions ?? []}
              {...(position ? { selected: position } : {})}
              labelFor={label}
              onSelect={choosePosition}
            />
          </aside>

          <section className="flex flex-col gap-6">
            {gap?.resolved && (
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {t('passbook.readinessFor', { position: label(position ?? '') })}
                </h2>
                <GapTable rows={gap.rows} labelFor={label} showCriticality={showCriticality} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground">{t('passbook.competenciesHeld')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {entries.map((entry) => (
                  <CompetencyCard
                    key={entry.competencyId}
                    entry={entry}
                    isExpanded={expanded === entry.competencyId}
                    onToggle={() =>
                      setExpanded(expanded === entry.competencyId ? null : entry.competencyId)
                    }
                    labelFor={label}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Passbook;
