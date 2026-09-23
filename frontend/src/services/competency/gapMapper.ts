import {
  GAP_STATUS,
  type CompetencyFrameworkMeta,
  type CompetencyFrameworkReadResponse,
  type CompetencyGap,
  type GapReadResponse,
  type GapRow,
  type GapRowWire,
} from '../../types/competencyServiceTypes';

/**
 * Wire -> view for `gap/read`.
 *
 * `resolved` is the important field. When the learner has no stored position and
 * none was supplied, the service replies `{gap: [], readiness: 0, position: ""}`
 * - a zero that means "unknown". Rendering that as "0% ready" would tell a fully
 * qualified learner they are unqualified, so the flag lets the UI show a
 * "choose a position" state instead of a score.
 */
export function normaliseGap(response: GapReadResponse | undefined | null): CompetencyGap {
  // The adapter already unwraps `result`; tolerate the raw envelope too.
  const r = response?.gap !== undefined || response?.position !== undefined
    ? response
    : response?.result;
  const rows = (r?.gap ?? [])
    .filter((g): g is GapRowWire => Boolean(g?.competencyId))
    .map((g) => ({
      competencyId: g.competencyId ?? '',
      requiredLevel: g.requiredLevel ?? '',
      requiredLevelIndex: typeof g.requiredLevelIndex === 'number' ? g.requiredLevelIndex : 0,
      heldLevel: g.heldLevel ?? '',
      heldLevelIndex: typeof g.heldLevelIndex === 'number' ? g.heldLevelIndex : 0,
      criticality: g.criticality ?? '',
      status: g.status ?? GAP_STATUS.missing,
    }));
  const position = r?.position ?? '';
  return {
    rows,
    readiness: typeof r?.readiness === 'number' ? r.readiness : 0,
    position,
    frameworkId: r?.frameworkId ?? '',
    mandatoryOutstanding:
      typeof r?.mandatoryOutstanding === 'number' ? r.mandatoryOutstanding : 0,
    resolved: position.length > 0,
  };
}

/** Unmet first, then by how far short the learner is - the natural reading order. */
export function sortGapRows(rows: GapRow[]): GapRow[] {
  const rank = (s: string) => (s === GAP_STATUS.missing ? 0 : s === GAP_STATUS.below ? 1 : 2);
  return [...rows].sort(
    (a, b) => rank(a.status) - rank(b.status) || a.competencyId.localeCompare(b.competencyId)
  );
}

/**
 * Wire -> view for `framework/read`.
 *
 * `positions` lists only codes that declare at least one requirement. A position
 * with none would render as a target the learner is trivially 100% ready for,
 * which is misleading - and on a mis-authored framework (requirement terms
 * missing their associations) that is exactly what happens, so it is filtered
 * here rather than trusted.
 */
export function normaliseFrameworkMeta(
  response: CompetencyFrameworkReadResponse | undefined | null
): CompetencyFrameworkMeta | undefined {
  const r = response?.frameworkId ? response : response?.result;
  if (!r?.frameworkId) return undefined;
  const requirements = r.requirements ?? {};
  const positions = Object.keys(requirements)
    .filter((code) => (requirements[code] ?? []).length > 0)
    .sort((a, b) => a.localeCompare(b));
  return {
    frameworkId: r.frameworkId,
    levels: [...(r.levels ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
    requirements,
    positions,
  };
}

/** Display label for a level code, from the framework scale; falls back to the code. */
export function levelLabel(meta: CompetencyFrameworkMeta | undefined, code: string): string {
  if (!code) return '';
  const hit = meta?.levels.find((l) => l.code === code);
  return hit?.code ?? code;
}

/**
 * Highest level index in the scale, for rendering "held 3 of 4". Zero when the
 * framework did not resolve, which callers must treat as "no scale to draw".
 */
export function topLevelIndex(meta: CompetencyFrameworkMeta | undefined): number {
  return (meta?.levels ?? []).reduce((max, l) => Math.max(max, l.index ?? 0), 0);
}
