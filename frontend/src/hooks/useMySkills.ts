import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { collectionHierarchyQueryOptions } from './useCollection';
import { useUserEnrolledCollections } from './useUserEnrolledCollections';
import { useViewerSummary } from './useViewerSummary';
import { getPathSummary, indexSummaryByCollectionId, parseCourseContextId } from '../services/viewer/summaryMapper';
import { parseLearningPath } from '../services/learningPath/learningPathMapper';
import { aggregateSkills, buildPathSkillSummary } from '../services/learningPath/skillAggregation';
import { isLearningPathCategory } from '../utils/isLearningPath';
import type { PathSkillSummary, SkillAggregate } from '../services/learningPath/skillAggregation';
import type { CollectionData } from '../types/collectionTypes';
import type { TrackableCollection } from '../types/TrackableCollections';

/** Most-recent-activity ordering; `enrolledDate` arrives as either an epoch or an ISO string. */
function recencyOf(course: TrackableCollection): number {
  if (course.lastContentAccessTime) return course.lastContentAccessTime;
  const enrolled = course.enrolledDate;
  if (typeof enrolled === 'number') return enrolled;
  const parsed = enrolled ? new Date(enrolled).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

interface EnrolledPath {
  pathId: string;
  contextId?: string;
  name: string;
}

export interface MySkillsEntry {
  path: EnrolledPath;
  /** Undefined until this path's hierarchy resolves. */
  summary?: PathSkillSummary;
  isLoading: boolean;
  isError: boolean;
}

export interface UseMySkillsResult {
  entries: MySkillsEntry[];
  summaries: PathSkillSummary[];
  aggregate: SkillAggregate;
  /** Paths whose hierarchy has resolved — drives the "Analyzed X of Y" indicator. */
  analyzedCount: number;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Every skill the learner has gained or has still to unlock, across all enrolled
 * Learning Paths.
 *
 * Skills live only in each path's hierarchy, so this fans out one hierarchy
 * query per enrolled path. They share `useCollection`'s cache keys, so a path
 * already opened elsewhere costs nothing, and results stream in individually —
 * the page renders each card as its query lands rather than blocking on all N.
 */
export function useMySkills(): UseMySkillsResult {
  const enrolments = useUserEnrolledCollections();
  const { data: summaryRecords = [], isLoading: summaryLoading } = useViewerSummary();

  const paths = useMemo<EnrolledPath[]>(() => {
    const courses = enrolments.data?.data?.courses ?? [];
    return courses
      // A Learning Path enrolment fans out one record per course under a composite
      // "<lpBatchId>:<courseId>" batchId — the path's own record represents it.
      .filter((c) => !parseCourseContextId(c.batchId))
      .filter((c) => isLearningPathCategory(c.content?.primaryCategory))
      .slice()
      .sort((a, b) => recencyOf(b) - recencyOf(a))
      .map((c) => ({ pathId: c.courseId, contextId: c.batchId, name: c.content?.name ?? '' }));
  }, [enrolments.data]);

  const hierarchyQueries = useQueries({
    queries: paths.map((path) => collectionHierarchyQueryOptions(path.pathId)),
  });

  const summaryByCollectionId = useMemo(() => indexSummaryByCollectionId(summaryRecords), [summaryRecords]);

  const entries = useMemo<MySkillsEntry[]>(
    () =>
      paths.map((path, i) => {
        const query = hierarchyQueries[i];
        const data = query?.data as CollectionData | null | undefined;
        const hierarchyRoot = data?.hierarchyRoot ?? null;

        if (!hierarchyRoot) {
          return { path, isLoading: !!query?.isLoading || summaryLoading, isError: !!query?.isError };
        }

        const model = parseLearningPath(hierarchyRoot);
        const pathSummary = getPathSummary(summaryRecords, path.pathId, path.contextId);
        const summary = buildPathSkillSummary(model, pathSummary, summaryByCollectionId, path.contextId);
        return { path, summary, isLoading: false, isError: false };
      }),
    [paths, hierarchyQueries, summaryRecords, summaryByCollectionId, summaryLoading]
  );

  const summaries = useMemo(
    () => entries.map((e) => e.summary).filter((s): s is PathSkillSummary => !!s),
    [entries]
  );
  const aggregate = useMemo(() => aggregateSkills(summaries), [summaries]);

  return {
    entries,
    summaries,
    aggregate,
    analyzedCount: summaries.length,
    totalCount: paths.length,
    isLoading: enrolments.isLoading || summaryLoading,
    isError: enrolments.isError,
    refetch: () => void enrolments.refetch(),
  };
}
