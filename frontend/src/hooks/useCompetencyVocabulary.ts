import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { FrameworkService } from '@/services/FrameworkService';
import { buildAreaIndex, type FrameworkVocabulary } from '@/services/competency/passbookGrouping';
import { humaniseCode } from '@/services/competency';

const frameworkService = new FrameworkService();

interface Term {
  code?: string;
  name?: string;
  associations?: Array<{ category?: string; code?: string }>;
}
interface Category {
  code?: string;
  terms?: Term[];
}
interface TaxonomyFrameworkResponse {
  result?: { framework?: { categories?: Category[] } };
}

/**
 * Display names and competency-area membership for EVERY framework the learner
 * holds competencies in, fetched in parallel.
 *
 * Why the taxonomy read rather than `competency/v1/framework/read`: the latter
 * returns the resolved scale and requirement matrix but only CODES - there are no
 * display names and no area membership on it. Both live on the framework's terms.
 *
 * Why `useQueries`: the number of frameworks is data-dependent, so a fixed set of
 * `useQuery` calls cannot cover it and calling one per framework in a loop would
 * break the hook ordering rule. Mirrors `useMySkills`, which fans out the same way.
 */
export function useCompetencyVocabulary(frameworkIds: string[]): {
  vocabularies: Record<string, FrameworkVocabulary | undefined>;
  isLoading: boolean;
} {
  const ids = useMemo(() => Array.from(new Set(frameworkIds.filter(Boolean))).sort(), [frameworkIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['framework', id],
      queryFn: () => frameworkService.read<TaxonomyFrameworkResponse>(id),
      enabled: Boolean(id),
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const vocabularies = useMemo(() => {
    const out: Record<string, FrameworkVocabulary | undefined> = {};
    ids.forEach((id, i) => {
      const categories = queries[i]?.data?.data?.result?.framework?.categories ?? [];
      const labels: Record<string, string> = {};
      categories.forEach((category) => {
        (category.terms ?? []).forEach((term) => {
          if (term.code && term.name) labels[term.code] = term.name;
        });
      });
      const competencyTerms = categories.find((c) => c.code === 'competency')?.terms ?? [];
      const areaTerms = categories.find((c) => c.code === 'competencyarea')?.terms ?? [];
      out[id] = { frameworkId: id, labels, areaOf: buildAreaIndex(competencyTerms, areaTerms) };
    });
    return out;
  }, [ids, queries]);

  return { vocabularies, isLoading };
}

/** The framework's own name for a code, else a de-slugged fallback so no raw code is shown. */
export function labelIn(vocab: FrameworkVocabulary | undefined, code: string): string {
  if (!code) return '';
  return vocab?.labels[code] ?? humaniseCode(code);
}
