/**
 * Player Event Normalizer
 *
 * Converts player-specific event shapes into a unified internal format for
 * useContentStateUpdate. Adding a new player = update only this file.
 *
 * QUML_SUMMARY is the QUML player's terminal assessment event. It carries
 * score + endpageseen in edata.extra[] (id/value pairs) rather than as
 * top-level edata fields. This normalizer flattens them so the hook can
 * use a single code path for all assessment content types.
 */

interface QumlExtra {
  id: string;
  value: unknown;
}

function getExtra(extra: QumlExtra[], id: string): unknown {
  return extra.find((e) => e.id === id)?.value;
}

/**
 * Normalized event shape understood by useContentStateUpdate.
 * Compatible with the existing TelemetryEvent type in that hook.
 */
export interface NormalizedAssessmentCompleteEvent {
  eid: 'QUML_SUMMARY';
  /** Start timestamp from the player, used as assessmentTs fallback. */
  ets?: number;
  edata: {
    /** Total score for the attempt. undefined means no score was emitted. */
    score?: number;
    /** True when the player's end/summary page was reached. */
    endpageseen: boolean;
  };
}

/**
 * Normalize a raw QUML playerEvent for consumption by useContentStateUpdate.
 *
 * Returns a NormalizedAssessmentCompleteEvent for QUML_SUMMARY events.
 * Returns the event unchanged for all other events (standard telemetry).
 */
export function normalizeQumlPlayerEvent(event: unknown): unknown {
  if (!event || typeof event !== 'object') return event;
  const e = event as Record<string, unknown>;

  // QumlPlayerEvent wraps the raw QUML event detail in `.data`
  const detail = (e.data ?? e) as Record<string, unknown>;
  const eid = String(detail?.eid ?? e.type ?? '');

  if (eid !== 'QUML_SUMMARY') return event;

  const edataRaw = detail?.edata as Record<string, unknown> | undefined;
  const extra: QumlExtra[] = Array.isArray(edataRaw?.extra) ? (edataRaw!.extra as QumlExtra[]) : [];

  const rawScore = getExtra(extra, 'score');
  const rawEndpage = getExtra(extra, 'endpageseen');

  // QUML emits extra values as strings; coerce to native types.
  const score = typeof rawScore === 'number' ? rawScore : parseFloat(String(rawScore ?? 'NaN'));
  const endpageseen = String(rawEndpage).toLowerCase() === 'true';

  // edata.starttime is the session start epoch ms — use as assessmentTs fallback
  const starttime = typeof edataRaw?.starttime === 'number' ? edataRaw.starttime : undefined;

  const normalized: NormalizedAssessmentCompleteEvent = {
    eid: 'QUML_SUMMARY',
    ets: starttime,
    edata: {
      score: Number.isNaN(score) ? undefined : score,
      endpageseen,
    },
  };

  return normalized;
}
