import { useMemo, useState } from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';
import useImpression from '@/hooks/useImpression';
import { useMySkills } from '@/hooks/useMySkills';
import { useSkillSuggestions } from '@/hooks/useSkillSuggestions';
import PageLoader from '@/components/common/PageLoader';
import { MySkillsHero } from '@/components/mySkills/MySkillsHero';
import { MySkillsControls } from '@/components/mySkills/MySkillsControls';
import { SkillInsights } from '@/components/mySkills/SkillInsights';
import { SkillGrowthChart } from '@/components/mySkills/SkillGrowthChart';
import { SkillSuggestionRow } from '@/components/mySkills/SkillSuggestionRow';
import { SkillCard } from '@/components/mySkills/SkillCard';
import { SkillPathAccordion } from '@/components/mySkills/SkillPathAccordion';
import { filterPathSummaries } from '@/services/learningPath/skillAggregation';
import { buildSkillGrowthSeries } from '@/services/learningPath/skillGrowth';
import {
  buildSkillIndex,
  filterSkillEntries,
  getMostReinforcedSkills,
  getRecentlyGainedSkills,
} from '@/services/learningPath/skillIndex';
import type { SkillsView } from '@/components/mySkills/MySkillsControls';
import type { PathSkillStatus } from '@/services/learningPath/skillAggregation';
import type { SkillStatusFilter } from '@/services/learningPath/skillIndex';

const PAGE_SIZE = 24;

const MySkills = () => {
  const { t } = useAppI18n();
  useImpression({ type: 'view', pageid: 'my-skills', env: 'profile' });

  const { entries, summaries, aggregate, analyzedCount, totalCount, isLoading, isError, refetch } = useMySkills();

  const [view, setView] = useState<SkillsView>('skills');
  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<SkillStatusFilter>('all');
  const [pathFilter, setPathFilter] = useState<PathSkillStatus | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);

  const skillIndex = useMemo(() => buildSkillIndex(summaries), [summaries]);
  const recentlyGained = useMemo(() => getRecentlyGainedSkills(skillIndex), [skillIndex]);
  const mostReinforced = useMemo(() => getMostReinforcedSkills(skillIndex), [skillIndex]);
  const growthSeries = useMemo(() => buildSkillGrowthSeries(skillIndex), [skillIndex]);

  const enrolledPathIds = useMemo(() => entries.map((entry) => entry.path.pathId), [entries]);
  const { suggestions } = useSkillSuggestions(summaries, enrolledPathIds);

  const visibleSkills = useMemo(
    () => filterSkillEntries(skillIndex, { query, status: skillFilter }).slice(0, visibleCount),
    [skillIndex, query, skillFilter, visibleCount]
  );
  const totalSkillMatches = useMemo(
    () => filterSkillEntries(skillIndex, { query, status: skillFilter }).length,
    [skillIndex, query, skillFilter]
  );

  // A path still loading has no skills to match on yet, so it stays visible as a skeleton.
  const matchedPathIds = useMemo(
    () => new Set(filterPathSummaries(summaries, { query, status: pathFilter }).map((s) => s.pathId)),
    [summaries, query, pathFilter]
  );
  const matchingPathEntries = useMemo(
    () => entries.filter((e) => !e.summary || matchedPathIds.has(e.summary.pathId)),
    [entries, matchedPathIds]
  );
  const visiblePaths = matchingPathEntries.slice(0, visibleCount);

  const isSkillsView = view === 'skills';
  const hasMore = isSkillsView ? totalSkillMatches > visibleSkills.length : matchingPathEntries.length > visiblePaths.length;

  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  const selectSkillFromInsights = (skill: string) => {
    setView('skills');
    setSkillFilter('all');
    setQuery(skill);
    setExpandedSkill(skill);
    resetPaging();
  };

  const filterOptions = isSkillsView
    ? [
        { value: 'all', label: t('tabs.all') },
        { value: 'gained', label: t('mySkills.gained') },
        { value: 'pending', label: t('mySkills.pending') },
      ]
    : [
        { value: 'all', label: t('tabs.all') },
        { value: 'completed', label: t('status.completed') },
        { value: 'ongoing', label: t('status.ongoing') },
        { value: 'not-started', label: t('status.notStarted') },
      ];

  if (isLoading) return <PageLoader message={t('mySkills.loading')} fullPage={false} />;
  if (isError) return <PageLoader error={t('mySkills.errorLoading')} onRetry={refetch} fullPage={false} />;

  return (
    <div className="mx-auto w-full max-w-[110rem] px-6 py-7">
      <h1 className="text-xl font-bold text-foreground">{t('mySkills.title')}</h1>
      <p className="mt-1 text-sm text-sunbird-gray-75">{t('mySkills.subtitle')}</p>

      {totalCount === 0 ? (
        <div className="mt-6 flex min-h-[12rem] items-center justify-center rounded-2xl border border-sunbird-gray-e5 bg-surface">
          <p className="text-sm text-sunbird-gray-75">{t('mySkills.noPaths')}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[19rem_1fr] lg:items-start">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-[8.625rem]">
            <MySkillsHero aggregate={aggregate} analyzedCount={analyzedCount} totalCount={totalCount} />
            <SkillGrowthChart series={growthSeries} />
            <SkillInsights
              recentlyGained={recentlyGained}
              mostReinforced={mostReinforced}
              onSelectSkill={selectSkillFromInsights}
            />
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <SkillSuggestionRow suggestions={suggestions} />
            <MySkillsControls
              view={view}
              onViewChange={(next) => {
                setView(next);
                resetPaging();
              }}
              query={query}
              onQueryChange={(next) => {
                setQuery(next);
                resetPaging();
              }}
              filter={isSkillsView ? skillFilter : pathFilter}
              onFilterChange={(next) => {
                if (isSkillsView) setSkillFilter(next as SkillStatusFilter);
                else setPathFilter(next as PathSkillStatus | 'all');
                resetPaging();
              }}
              filterOptions={filterOptions}
              resultLabel={
                isSkillsView
                  ? t('mySkills.skillCount', { count: totalSkillMatches })
                  : t('mySkills.pathResultCount', { count: matchingPathEntries.length })
              }
            />

            {isSkillsView ? (
              visibleSkills.length === 0 ? (
                <EmptyResult label={t('mySkills.noSkillResults')} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleSkills.map((entry) => (
                    <SkillCard
                      key={entry.skill}
                      entry={entry}
                      isExpanded={expandedSkill === entry.skill}
                      onToggle={() => setExpandedSkill((prev) => (prev === entry.skill ? null : entry.skill))}
                    />
                  ))}
                </div>
              )
            ) : visiblePaths.length === 0 ? (
              <EmptyResult label={t('mySkills.noResults')} />
            ) : (
              <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                {visiblePaths.map((entry) => (
                  <SkillPathAccordion
                    key={entry.path.contextId ?? entry.path.pathId}
                    pathName={entry.summary?.pathName || entry.path.name}
                    summary={entry.summary}
                    isLoading={entry.isLoading}
                    isExpanded={expandedPathId === entry.path.pathId}
                    onToggle={() =>
                      setExpandedPathId((prev) => (prev === entry.path.pathId ? null : entry.path.pathId))
                    }
                  />
                ))}
              </div>
            )}

            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="self-center text-sm font-medium text-sunbird-brick hover:underline"
              >
                {t('mySkills.loadMore')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function EmptyResult({ label }: { label: string }) {
  return (
    <div className="flex min-h-[8rem] items-center justify-center rounded-2xl border border-sunbird-gray-e5 bg-surface">
      <p className="text-sm text-sunbird-gray-75">{label}</p>
    </div>
  );
}

export default MySkills;
