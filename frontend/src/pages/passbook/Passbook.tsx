import { useMemo, useState } from 'react';
import { FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import useImpression from '@/hooks/useImpression';
import PageLoader from '@/components/common/PageLoader';
import { PassbookHero } from '@/components/passbook/PassbookHero';
import { FrameworkSectionView } from '@/components/passbook/FrameworkSectionView';
import { usePassbook } from '@/hooks/usePassbook';
import { useCompetencyVocabulary, labelIn } from '@/hooks/useCompetencyVocabulary';
import { useCompetencyFrameworks, useCompetencyGap, useSaveTargetPosition } from '@/hooks/useCompetencyGap';
import { buildFrameworkSections } from '@/services/competency/passbookGrouping';
import { isHeld } from '@/services/competency';

/**
 * The learner's competency passbook: what they hold, grouped by competency area,
 * and readiness against a target role.
 *
 * MULTIPLE FRAMEWORKS ARE FIRST-CLASS. A learner can hold competencies from more
 * than one framework - two Learning Paths built on different frameworks, or a
 * platform mid-migration (User 23 on the test cluster holds both
 * fw_health_competency and fw_health_competency2). One flat list would mix
 * vocabularies, and a gap can only be computed against one framework's requirement
 * set, so the page renders a section per framework with its own roles and gap.
 *
 * WHY THE ROLE IS CHOSEN HERE rather than read from the learner's record:
 * `user_competency_position` is written only by an HR feed or the privileged
 * position API, so for most learners it is empty - and `gap/read` reports that as
 * `readiness: 0`, which must not be shown as a score.
 */
const Passbook = () => {
  const { t } = useAppI18n();
  useImpression({ type: 'view', pageid: 'competency-passbook', env: 'profile' });

  const { entries, isLoading, isError, refetch } = usePassbook();

  const frameworkIds = useMemo(
    () => Array.from(new Set(entries.map((e) => e.frameworkId).filter(Boolean))),
    [entries]
  );
  const { vocabularies } = useCompetencyVocabulary(frameworkIds);
  const { metas } = useCompetencyFrameworks(frameworkIds);

  // One target at a time: the gap is per (framework, role), and a learner aims at
  // one role. Held as a pair so picking a role in one framework's section cannot
  // leave a stale gap rendered under another's.
  const [target, setTarget] = useState<{ frameworkId: string; position: string }>();
  const { gap } = useCompetencyGap(target?.frameworkId, target?.position);
  const saveTarget = useSaveTargetPosition(target?.frameworkId);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sections = useMemo(() => buildFrameworkSections(entries, vocabularies), [entries, vocabularies]);
  const heldCount = useMemo(() => entries.filter(isHeld).length, [entries]);

  const choose = (frameworkId: string) => (position: string) => {
    setTarget({ frameworkId, position });
    saveTarget.mutate(position);
  };

  if (isLoading) return <PageLoader />;
  // An unreachable API and an empty passbook look identical unless the error is
  // surfaced, so this shows retry rather than "no competencies yet".
  if (isError) return <PageLoader error={t('somethingWentWrong')} onRetry={() => void refetch()} />;

  const showFrameworkHeadings = sections.length > 1;

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
          <aside>
            <PassbookHero
              heldCount={heldCount}
              totalCount={entries.length}
              {...(gap?.resolved ? { readiness: gap.readiness, outstanding: gap.mandatoryOutstanding } : {})}
              {...(target && gap?.resolved
                ? { positionLabel: labelIn(vocabularies[target.frameworkId], target.position) }
                : {})}
            />
          </aside>

          <div className="flex flex-col gap-8">
            {sections.map((section) => {
              const vocab = vocabularies[section.frameworkId];
              const isTargeted = target?.frameworkId === section.frameworkId;
              return (
                <FrameworkSectionView
                  key={section.frameworkId}
                  section={section}
                  showFrameworkHeading={showFrameworkHeadings}
                  frameworkLabel={labelIn(vocab, section.frameworkId)}
                  positions={metas[section.frameworkId]?.positions ?? []}
                  {...(isTargeted && target ? { selectedPosition: target.position } : {})}
                  {...(isTargeted && gap ? { gap } : {})}
                  onSelectPosition={choose(section.frameworkId)}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                  labelFor={(code) => labelIn(vocab, code)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Passbook;
