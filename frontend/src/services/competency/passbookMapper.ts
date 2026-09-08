import {
  PASSBOOK_STATUS,
  type Evidence,
  type EvidenceWire,
  type PassbookEntry,
  type PassbookEntryWire,
  type PassbookReadResponse,
} from '../../types/competencyServiceTypes';

/** Milliseconds for a wire date, or undefined when absent/unparseable. */
function toEpoch(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

function normaliseEvidence(raw: EvidenceWire[] | undefined): Evidence[] {
  return (raw ?? [])
    .filter((e): e is EvidenceWire => Boolean(e?.evidenceId))
    .map((e) => ({
      evidenceId: e.evidenceId ?? '',
      level: e.level ?? '',
      sourceType: e.sourceType ?? '',
      sourceId: e.sourceId ?? '',
      ...(typeof e.score === 'number' ? { score: e.score } : {}),
      ...(typeof e.maxScore === 'number' ? { maxScore: e.maxScore } : {}),
      ...(toEpoch(e.occurredOn) !== undefined ? { occurredOn: toEpoch(e.occurredOn) } : {}),
    }));
}

/**
 * Wire -> view. Entries with no `competencyId` are dropped: without one there is
 * nothing to label, resolve a name for, or match against a requirement.
 *
 * Evidence is deduplicated on `evidenceId`. The ledger is append-only and the
 * service currently writes one row per re-projection, so the same underlying
 * fact can arrive many times over (observed: 10 rows for 5 attainments, and
 * 60-70 for a completion-driven path). Showing every duplicate would imply the
 * learner proved a competency far more often than they did.
 */
export function normalisePassbook(response: PassbookReadResponse | undefined | null): PassbookEntry[] {
  // The adapter already unwraps `result`, so the unwrapped shape is the normal
  // one; `result` is tolerated in case a caller passes the raw envelope.
  const raw = response?.competencies ?? response?.result?.competencies ?? [];
  return raw
    .filter((e): e is PassbookEntryWire => Boolean(e?.competencyId))
    .map((e) => {
      const seen = new Set<string>();
      const evidence = normaliseEvidence(e.evidence).filter((ev) => {
        if (seen.has(ev.evidenceId)) return false;
        seen.add(ev.evidenceId);
        return true;
      });
      return {
        competencyId: e.competencyId ?? '',
        frameworkId: e.frameworkId ?? '',
        level: e.level ?? '',
        levelIndex: typeof e.levelIndex === 'number' ? e.levelIndex : 0,
        status: e.status ?? PASSBOOK_STATUS.inProgress,
        sourceType: e.sourceType ?? '',
        ...(toEpoch(e.attainedOn) !== undefined ? { attainedOn: toEpoch(e.attainedOn) } : {}),
        ...(toEpoch(e.expiresOn) !== undefined ? { expiresOn: toEpoch(e.expiresOn) } : {}),
        evidence,
      };
    });
}

/** True for a level the learner currently holds (attained, or attained-but-lapsing). */
export function isHeld(entry: PassbookEntry): boolean {
  return entry.status === PASSBOOK_STATUS.attained || entry.status === PASSBOOK_STATUS.expiring;
}

/**
 * The framework the passbook belongs to. Entries carry it per-row rather than
 * the page being configured with one, so this picks the framework of the first
 * entry that names one - the ordinary case being that a learner's competencies
 * all come from a single framework.
 */
export function primaryFrameworkId(entries: PassbookEntry[]): string | undefined {
  return entries.find((e) => e.frameworkId)?.frameworkId;
}

/**
 * Human label for a code, used only when the framework has no term for it.
 * `medication-administration` and `medication_administration` both become
 * "Medication administration", so a missing framework term degrades to
 * something readable rather than a raw slug.
 */
export function humaniseCode(code: string): string {
  const words = code.replace(/[_-]+/g, ' ').trim();
  if (!words) return code;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
