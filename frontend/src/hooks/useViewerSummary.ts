import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { viewerService } from '../services/viewer';
import { normaliseSummaryRecords } from '../services/viewer/summaryMapper';
import { useUserId } from './useAuthInfo';
import type { AssessmentScoreEntry, ViewerSummaryRecord } from '../types/viewerServiceTypes';

/**
 * Fetches and normalises `GET /v1/summary/list/{userId}` — the Viewer
 * Service's single source of truth for path, level and course progress. See
 * `services/viewer/summaryMapper.ts` for the wire-shape normalisation.
 */
export function useViewerSummary(): UseQueryResult<ViewerSummaryRecord[], Error> {
  const userId = useUserId();

  return useQuery({
    queryKey: ['viewerSummary', userId],
    queryFn: async (): Promise<ViewerSummaryRecord[]> => {
      if (!userId) return [];
      const response = await viewerService.summaryList(userId);
      return normaliseSummaryRecords(response.data);
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

/** Invalidates the Viewer Service summary cache for the current user — call after enrol and after a view ends. */
export function useInvalidateViewerSummary(): () => Promise<void> {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMemo(
    () => () => queryClient.invalidateQueries({ queryKey: ['viewerSummary', userId] }),
    [queryClient, userId]
  );
}

/**
 * Swaps a single confirmed record (from `POST /v1/summary/read`, the
 * "specific enrolment" API) into the `['viewerSummary', userId]` cache —
 * matched by `collectionId` + `contextId`. The summary API is synchronous, so
 * this is a precise correction of the optimistic patch rather than a guess;
 * appends the record when no cached entry matches yet (first-ever write to a
 * fresh enrolment).
 */
export function useMergeViewerSummaryRecord(): (record: ViewerSummaryRecord) => void {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useCallback(
    (record) => {
      if (!userId) return;
      queryClient.setQueryData<ViewerSummaryRecord[]>(['viewerSummary', userId], (old) => {
        if (!old) return old;
        const idx = old.findIndex(
          (r) => r.collectionId === record.collectionId && r.contextId === record.contextId
        );
        if (idx === -1) return [...old, record];
        const next = [...old];
        // The live service does not return `assessmentStatus` yet, and this is a
        // wholesale record replacement - so without this, every confirmation
        // round-trip would erase the score the optimistic patch just recorded.
        const previous = old[idx];
        next[idx] =
          record.assessmentStatus === undefined && previous?.assessmentStatus !== undefined
            ? { ...record, assessmentStatus: previous.assessmentStatus }
            : record;
        return next;
      });
    },
    [queryClient, userId]
  );
}

/**
 * Optimistically patches the cached `['viewerSummary', userId]` data the
 * moment a view/assessment write succeeds — level lock/unlock and completion
 * badges derive synchronously from this cache (see `useLearningPath`), so
 * this is what makes them flip immediately instead of waiting on the
 * (synchronous, but still round-trip-latency) summary confirmation to land
 * (`useMergeViewerSummaryRecord`, which corrects anything this local patch
 * got wrong - e.g. aggregate `completionPercentage`).
 *
 * Patches every cached record that already tracks `contentId` (this covers
 * the Learning Path root record, whose `contentStatus` spans every leaf in
 * the path) plus the record for `collectionId` itself. If NO cached record
 * matches `collectionId` at all (the very first write to a fresh
 * enrolment, before the server has produced any summary record for it), a
 * new minimal one is appended rather than silently no-op'ing - without this,
 * a course's first-ever completion would never unlock anything until the
 * next full summary refetch happens to include it.
 */
export function useOptimisticViewerSummaryPatch(): (
  collectionId: string,
  contentId: string,
  status: number,
  assessmentScore?: AssessmentScoreEntry
) => void {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useCallback(
    (collectionId, contentId, status, assessmentScore) => {
      if (!userId) return;
      queryClient.setQueryData<ViewerSummaryRecord[]>(['viewerSummary', userId], (old) => {
        if (!old) return old;

        /**
         * Keeps `assessmentStatus[contentId]` as the BEST score across attempts
         * (matching the legacy course player, where `getContentAttemptInfoMap`
         * picks the highest `totalScore` out of the score array) and counts the
         * attempt locally. A weaker retry must never lower a learner's best score.
         */
        const mergeAssessment = (
          previous: AssessmentScoreEntry | undefined,
          next: AssessmentScoreEntry
        ): AssessmentScoreEntry => ({
          score: previous ? Math.max(previous.score, next.score) : next.score,
          // A QUML_SUMMARY-only submission can report a 0 max; keep the known one.
          max_score: next.max_score || previous?.max_score || 0,
          attempts: (previous?.attempts ?? 0) + 1,
        });

        const patchRecord = (record: ViewerSummaryRecord): ViewerSummaryRecord => ({
          ...record,
          contentStatus: { ...record.contentStatus, [contentId]: status },
          ...(assessmentScore
            ? {
                assessmentStatus: {
                  ...(record.assessmentStatus ?? {}),
                  [contentId]: mergeAssessment(record.assessmentStatus?.[contentId], assessmentScore),
                },
              }
            : {}),
        });

        const hasCollectionRecord = old.some((record) => record.collectionId === collectionId);
        const patched = old.map((record) => {
          const touchesThisContent = record.collectionId === collectionId || contentId in (record.contentStatus ?? {});
          return touchesThisContent ? patchRecord(record) : record;
        });

        if (hasCollectionRecord) return patched;

        const newRecord = patchRecord({
          userId,
          collectionId,
          active: true,
          status,
          progress: 0,
          contentStatus: {},
        });
        return [...patched, newRecord];
      });
    },
    [queryClient, userId]
  );
}
