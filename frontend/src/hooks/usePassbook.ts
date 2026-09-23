import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  competencyService,
  normalisePassbook,
  normalisePosition,
  primaryFrameworkId,
  humaniseCode,
} from '@/services/competency';
import { frameworkCategories, type TaxonomyFrameworkResponse } from '@/services/competency/passbookGrouping';
import { FrameworkService } from '@/services/FrameworkService';
import { useUserId } from './useAuthInfo';
import type { PassbookEntry } from '@/types/competencyServiceTypes';

const frameworkService = new FrameworkService();


/**
 * The learner's passbook. `evidence: true` so a card can answer "what proved
 * this?" without a second round trip.
 *
 * `isError` is deliberately surfaced to the page rather than swallowed: until
 * the Kong route exists these calls 404, and an unreachable API must not render
 * as "you hold no competencies" - the two are indistinguishable otherwise.
 */
export function usePassbook() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: ['competencyPassbook', userId],
    queryFn: async () => {
      const body = (await competencyService.passbookRead({ evidence: true })).data;
      // The role assignment rides along with the passbook - see normalisePosition.
      return { entries: normalisePassbook(body), position: normalisePosition(body) };
    },
    enabled: Boolean(userId),
  });

  const entries: PassbookEntry[] = query.data?.entries ?? [];
  return {
    entries,
    position: query.data?.position,
    frameworkId: primaryFrameworkId(entries),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Code -> display name for every term in the competency framework, read from the
 * TAXONOMY framework API (`/framework/v1/read/:id`).
 *
 * Why not `competency/v1/framework/read`: that endpoint returns the resolved
 * scale and requirement matrix but no display names - `frameworkRead` in
 * `CompetencyActor` emits `competencyId`/`requiredLevel` codes only. The names
 * live on the framework's terms, which only the taxonomy read exposes.
 */
export function useCompetencyLabels(frameworkId: string | undefined): Record<string, string> {
  const { data } = useQuery({
    queryKey: ['framework', frameworkId],
    queryFn: () => frameworkService.read<TaxonomyFrameworkResponse>(frameworkId!),
    enabled: Boolean(frameworkId),
  });

  return useMemo(() => {
    const categories = frameworkCategories(data?.data);
    const labels: Record<string, string> = {};
    categories.forEach((category) => {
      (category.terms ?? []).forEach((term) => {
        if (term.code && term.name) labels[term.code] = term.name;
      });
    });
    return labels;
  }, [data]);
}

/** The framework's name for a code, else a de-slugged fallback so no raw code is shown. */
export function labelFor(labels: Record<string, string>, code: string): string {
  return labels[code] ?? humaniseCode(code);
}
