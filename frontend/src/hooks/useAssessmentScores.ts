import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { viewerService } from '../services/viewer';
import { buildAssessmentReadMap } from '../services/viewer/assessmentReadMapper';
import {
  getAllStoredForCollection,
  recordAssessmentScore,
  type StoredAssessmentScore,
} from '../services/learningPath/assessmentScoreStore';
import { useUserId } from './useAuthInfo';
import type { AssessmentSourceEntry } from '../services/learningPath/learningPathAssessment';

/**
 * Reads back saved assessment scores via `POST /v1/assessment/read` - the one
 * Viewer Service endpoint that could return score/attempts (see
 * `assessmentReadMapper.ts` for why the other three can't). Kept under its own
 * query key so a `['viewerSummary']` refetch, which wipes the optimistic
 * `assessmentStatus` patch, can never touch this cache entry too.
 */
export function useAssessmentReadMap(
  collectionId: string | undefined,
  contextId: string | undefined,
  contentIds: string[]
): Record<string, AssessmentSourceEntry> {
  const userId = useUserId();
  const enabled = Boolean(userId && collectionId && contextId && contentIds.length > 0);

  const { data } = useQuery({
    queryKey: ['assessmentRead', userId, collectionId, contextId, contentIds],
    queryFn: async () => {
      const response = await viewerService.assessmentRead({
        userId: userId!,
        contentId: contentIds,
        collectionId,
        contextId,
      });
      const map = buildAssessmentReadMap(response.data);
      if (Object.keys(map).length === 0) {
        // The live wire shape for this endpoint is unconfirmed (it has never
        // been called in production before) - this is where that becomes visible.
        console.warn(
          '[assessmentRead] /v1/assessment/read returned no score entries - falling back to the local score store.'
        );
      }
      return map;
    },
    enabled,
    staleTime: 60 * 1000,
  });

  return data ?? {};
}

/** All locally-stored assessment scores for one Learning Path enrolment, keyed by leaf contentId. */
export function useStoredAssessmentScores(collectionId: string | undefined): Record<string, StoredAssessmentScore> {
  const userId = useUserId();
  const { data } = useQuery({
    queryKey: ['assessmentScores', userId, collectionId],
    queryFn: () => getAllStoredForCollection(userId!, collectionId!),
    enabled: Boolean(userId && collectionId),
    staleTime: Infinity,
  });
  return data ?? {};
}

/**
 * Persists a submitted score to the durable local store and refreshes both
 * caches that surface it - the `['assessmentScores']` cache (so components
 * re-render immediately) and `['assessmentRead']` (so a fresh
 * `/v1/assessment/read` is attempted in case the service now has the data).
 */
export function useRecordAssessmentScore(): (
  userId: string,
  collectionId: string,
  contextId: string,
  contentId: string,
  next: { score: number; maxScore: number }
) => void {
  const queryClient = useQueryClient();
  return useCallback(
    (userId, collectionId, contextId, contentId, next) => {
      const merged = recordAssessmentScore(userId, collectionId, contentId, next);
      queryClient.setQueryData<Record<string, StoredAssessmentScore>>(
        ['assessmentScores', userId, collectionId],
        (old) => ({ ...(old ?? {}), [contentId]: merged })
      );
      void queryClient.invalidateQueries({ queryKey: ['assessmentRead', userId, collectionId, contextId] });
    },
    [queryClient]
  );
}
