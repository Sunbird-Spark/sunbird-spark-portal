import { useMemo } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyService, normaliseGap, normaliseFrameworkMeta } from '@/services/competency';
import { useUserId } from './useAuthInfo';
import type { CompetencyFrameworkMeta, CompetencyGap } from '@/types/competencyServiceTypes';

/**
 * The competency framework's resolved scale and requirement matrix - the source
 * of the selectable positions.
 */
export function useCompetencyFramework(frameworkId: string | undefined): {
  meta: CompetencyFrameworkMeta | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useQuery({
    queryKey: ['competencyFramework', frameworkId],
    queryFn: async () => normaliseFrameworkMeta((await competencyService.frameworkRead(frameworkId!)).data),
    enabled: Boolean(frameworkId),
  });
  return { meta: query.data, isLoading: query.isLoading, isError: query.isError };
}

/**
 * Resolved meta for EVERY framework the learner holds competencies in, fetched in
 * parallel so each framework section can offer its own target roles. The number of
 * frameworks is data-dependent, so a fixed set of `useQuery` calls cannot cover it.
 */
export function useCompetencyFrameworks(frameworkIds: string[]): {
  metas: Record<string, CompetencyFrameworkMeta | undefined>;
  isLoading: boolean;
} {
  const ids = useMemo(() => Array.from(new Set(frameworkIds.filter(Boolean))).sort(), [frameworkIds]);
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['competencyFramework', id],
      queryFn: async () => normaliseFrameworkMeta((await competencyService.frameworkRead(id)).data),
      enabled: Boolean(id),
    })),
  });
  const isLoading = queries.some((q) => q.isLoading);
  const metas = useMemo(() => {
    const out: Record<string, CompetencyFrameworkMeta | undefined> = {};
    ids.forEach((id, i) => {
      out[id] = queries[i]?.data;
    });
    return out;
  }, [ids, queries]);
  return { metas, isLoading };
}

/**
 * Readiness against one position.
 *
 * The position is always sent explicitly. Relying on the learner's stored
 * assignment is not viable: `user_competency_position` is written only by an HR
 * feed or `position/update`, and with neither set the service answers
 * `readiness: 0` with an empty gap. `normaliseGap` marks that case `resolved:
 * false` so the UI can say "pick a target" instead of reporting 0%.
 */
export function useCompetencyGap(
  frameworkId: string | undefined,
  position: string | undefined
): { gap: CompetencyGap | undefined; isLoading: boolean; isError: boolean } {
  const userId = useUserId();
  const enabled = Boolean(userId && frameworkId && position);
  const query = useQuery({
    queryKey: ['competencyGap', userId, frameworkId, position],
    queryFn: async () =>
      normaliseGap((await competencyService.gapRead({ frameworkId: frameworkId!, position: position! })).data),
    enabled,
  });
  return { gap: query.data, isLoading: enabled && query.isLoading, isError: query.isError };
}

/**
 * Persists the learner's chosen target position.
 *
 * Best-effort by design: the gap is computed from the explicit position, so a
 * failed save costs the learner their saved preference, not the readiness figure
 * they are currently looking at. Only `targetPositions` can be set here -
 * `currentPosition` is stripped server-side, since who a learner reports as is
 * an assignment rather than a preference.
 */
export function useSaveTargetPosition(frameworkId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (position: string) => {
      if (!frameworkId) return;
      await competencyService.updateTargetPositions({ frameworkId, targetPositions: [position] });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['competencyGap'] });
    },
  });
}
