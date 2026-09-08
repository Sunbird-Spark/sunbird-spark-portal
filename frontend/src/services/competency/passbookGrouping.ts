import type { PassbookEntry } from '../../types/competencyServiceTypes';

/** A competency framework's vocabulary: display names and the area each competency sits in. */
export interface FrameworkVocabulary {
  frameworkId: string;
  /** term code -> display name, across every category. */
  labels: Record<string, string>;
  /** competency code -> competency-area code. */
  areaOf: Record<string, string>;
}

export interface AreaGroup {
  /** Area code, or '' for competencies the framework does not place in an area. */
  areaCode: string;
  entries: PassbookEntry[];
}

export interface FrameworkSection {
  frameworkId: string;
  entries: PassbookEntry[];
  groups: AreaGroup[];
  /**
   * False when NO competency in this framework resolves to an area, in which case
   * the caller should render a flat list. Showing a single "Other" heading over
   * everything looks like a fault rather than a framework that simply does not
   * classify its competencies - `fw_health_competency2` is exactly that case, its
   * authoring sheet having omitted the Competency Area column.
   */
  grouped: boolean;
}

/**
 * Splits a passbook into one section per framework, each grouped by competency area.
 *
 * WHY PER FRAMEWORK: a learner can hold competencies from more than one framework -
 * two Learning Paths on different frameworks, or the same platform migrating between
 * versions. Rendering them as one flat list mixes vocabularies: codes collide in
 * spirit (`medication_administration` vs `medication-administration`), levels mean
 * different things, and a gap can only ever be computed against one framework at a
 * time. Sections keep each framework's terms resolving against its own vocabulary.
 *
 * Sections are ordered by size (most competencies first) so the learner's main
 * framework leads; areas are ordered by their display name, with the unclassified
 * group last.
 */
export function buildFrameworkSections(
  entries: PassbookEntry[],
  vocabularies: Record<string, FrameworkVocabulary | undefined>
): FrameworkSection[] {
  const byFramework = new Map<string, PassbookEntry[]>();
  entries.forEach((entry) => {
    const key = entry.frameworkId;
    const bucket = byFramework.get(key);
    if (bucket) bucket.push(entry);
    else byFramework.set(key, [entry]);
  });

  return Array.from(byFramework.entries())
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([frameworkId, frameworkEntries]) => {
      const vocab = vocabularies[frameworkId];
      const areaOf = vocab?.areaOf ?? {};
      const labels = vocab?.labels ?? {};

      const byArea = new Map<string, PassbookEntry[]>();
      frameworkEntries.forEach((entry) => {
        const area = areaOf[entry.competencyId] ?? '';
        const bucket = byArea.get(area);
        if (bucket) bucket.push(entry);
        else byArea.set(area, [entry]);
      });

      const groups: AreaGroup[] = Array.from(byArea.entries())
        .map(([areaCode, groupEntries]) => ({
          areaCode,
          entries: [...groupEntries].sort((a, b) =>
            (labels[a.competencyId] ?? a.competencyId).localeCompare(labels[b.competencyId] ?? b.competencyId)
          ),
        }))
        // unclassified last, otherwise alphabetical by the area's display name
        .sort((a, b) => {
          if (!a.areaCode) return 1;
          if (!b.areaCode) return -1;
          return (labels[a.areaCode] ?? a.areaCode).localeCompare(labels[b.areaCode] ?? b.areaCode);
        });

      return {
        frameworkId,
        entries: frameworkEntries,
        groups,
        grouped: groups.some((g) => g.areaCode !== ''),
      };
    });
}

/** A taxonomy framework read, in either the enveloped or the adapter-unwrapped shape. */
export interface TaxonomyFrameworkBody {
  framework?: { categories?: FrameworkCategoryLike[] };
}
export interface TaxonomyFrameworkResponse extends TaxonomyFrameworkBody {
  result?: TaxonomyFrameworkBody;
}
export interface FrameworkTermLike {
  code?: string;
  name?: string;
  associations?: Array<{ category?: string; code?: string }>;
}
export interface FrameworkCategoryLike {
  code?: string;
  terms?: FrameworkTermLike[];
}

/**
 * Categories out of a taxonomy framework read, whichever shape arrives.
 *
 * `AxiosAdapter.mapResponse` strips `result` before a caller sees the body, so the
 * unwrapped form is the normal one. Reading `result.framework` returned undefined,
 * which silently emptied every label and area - the passbook then rendered
 * de-slugged codes ("Health data reporting" instead of "Health Data and Reporting")
 * and no area grouping at all. Handling both shapes in one place stops this
 * recurring per call site.
 */
export function frameworkCategories(
  body: TaxonomyFrameworkResponse | undefined | null
): FrameworkCategoryLike[] {
  return body?.framework?.categories ?? body?.result?.framework?.categories ?? [];
}

/**
 * Builds `competency -> area` from a taxonomy framework read.
 *
 * Reads BOTH directions. `framework/v3/read` exposes only OUTBOUND associations, and
 * which side carries them depends on how the framework was authored: the CSV tool
 * links area -> competency, while a hand-authored framework may link competency ->
 * area. Taking either means grouping works without dictating the authoring style.
 */
export function buildAreaIndex(
  competencyTerms: Array<{ code?: string; associations?: Array<{ category?: string; code?: string }> }>,
  areaTerms: Array<{ code?: string; associations?: Array<{ category?: string; code?: string }> }>
): Record<string, string> {
  const areaOf: Record<string, string> = {};
  // competency -> area
  competencyTerms.forEach((term) => {
    if (!term.code) return;
    const area = (term.associations ?? []).find((a) => a.category === 'competencyarea')?.code;
    if (area) areaOf[term.code] = area;
  });
  // area -> competency (does not overwrite a competency's own declaration)
  areaTerms.forEach((area) => {
    if (!area.code) return;
    (area.associations ?? [])
      .filter((a) => a.category === 'competency' && a.code)
      .forEach((a) => {
        const code = a.code as string;
        if (!areaOf[code]) areaOf[code] = area.code as string;
      });
  });
  return areaOf;
}
