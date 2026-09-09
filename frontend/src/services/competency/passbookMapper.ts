import {
  PASSBOOK_STATUS,
  type PositionAssignment,
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
 * One row per DISTINCT fact, not per stored row.
 *
 * The evidence ledger is append-only and `AttainmentRules.evidenceId` prefixes its stable
 * `sourceType|sourceId|batchId` hash with `occurredOn` - which the caller passes as
 * `System.currentTimeMillis()`. So re-projecting the same completion writes a NEW id every time,
 * defeating the idempotency the hash was meant to give and leaving many rows describing one fact.
 * Observed live: 12 identical `COURSE` rows for one course completion, rendered as twelve
 * indistinguishable "Course - 08 Sept 2026" lines.
 *
 * Keying on the fact - source, level and score - collapses those to one row while keeping
 * genuinely different evidence apart: two assessment attempts on the same set with different
 * scores stay separate, because the score is part of the key.
 */
function collapseEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  evidence.forEach((ev) => {
    const key = [ev.sourceType, ev.sourceId, ev.level, ev.score ?? '', ev.maxScore ?? ''].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(ev);
  });
  return out;
}

/**
 * Wire -> view. Entries with no `competencyId` are dropped: without one there is
 * nothing to label, resolve a name for, or match against a requirement.
 *
 * Evidence is collapsed per distinct fact by `collapseEvidence` - see the note there for why
 * `evidenceId` is not a usable dedupe key.
 */
export function normalisePassbook(response: PassbookReadResponse | undefined | null): PassbookEntry[] {
  // The adapter already unwraps `result`, so the unwrapped shape is the normal
  // one; `result` is tolerated in case a caller passes the raw envelope.
  const raw = response?.competencies ?? response?.result?.competencies ?? [];
  return raw
    .filter((e): e is PassbookEntryWire => Boolean(e?.competencyId))
    .map((e) => {
      const evidence = collapseEvidence(normaliseEvidence(e.evidence));
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

/**
 * The learner's role assignment, from the same passbook response.
 *
 * It rides along with `passbook/read` rather than having its own endpoint: no other
 * operation echoes it (gap/read, recommend and position/update all read it server-side
 * and never return it), so without this the UI could not show the learner's current
 * role or which target is already saved.
 *
 * Undefined when the service returns no block at all - an older build - which callers
 * must treat as "unknown", distinct from a block whose currentPosition is simply unset.
 */
export function normalisePosition(
  response: PassbookReadResponse | undefined | null
): PositionAssignment | undefined {
  const raw = response?.position ?? response?.result?.position;
  if (!raw) return undefined;
  const current = raw.currentPosition?.trim();
  return {
    frameworkId: raw.frameworkId ?? '',
    ...(current ? { currentPosition: current } : {}),
    targetPositions: (raw.targetPositions ?? []).filter((p): p is string => Boolean(p && p.trim())),
    source: raw.source ?? '',
  };
}
