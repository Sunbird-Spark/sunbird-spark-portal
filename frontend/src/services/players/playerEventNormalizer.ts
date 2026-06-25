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

/** Normalized QUML_SUMMARY shape understood by useContentStateUpdate. */
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

/** Synthesized ASSESS event built from a QUML player-stream ASSESS event. */
export interface NormalizedAssessEvent {
  eid: 'ASSESS';
  ets?: number;
  edata: {
    score: number;
    item: Record<string, unknown>;
    resvalues: unknown[];
    duration: number;
  };
}

/**
 * Normalize a raw QUML playerEvent for consumption by useContentStateUpdate.
 *
 * - QUML_SUMMARY  → NormalizedAssessmentCompleteEvent (score + endpageseen)
 * - QUML player ASSESS (data.item.id + numeric data.score) → NormalizedAssessEvent
 *   These fire via the playerEvent stream when the telemetry SDK is not active.
 *   If telemetry ASSESS events also arrive they are deduplicated server-side by questionId.
 * - Everything else → returned unchanged.
 */
export function normalizeQumlPlayerEvent(event: unknown): unknown {
  if (!event || typeof event !== 'object') return event;
  const e = event as Record<string, unknown>;

  // QumlPlayerEvent wraps the raw QUML event detail in `.data`
  const detail = (e.data ?? e) as Record<string, unknown>;
  const eid = String(detail?.eid ?? e.type ?? '');

  if (eid === 'QUML_SUMMARY') {
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
      edata: { score: Number.isNaN(score) ? undefined : score, endpageseen },
    };
    return normalized;
  }

  // QUML player ASSESS events arrive via playerEvent (no eid, carries data.item + data.score).
  // Convert to standard ASSESS telemetry format so useContentStateUpdate can accumulate them.
  const item = detail.item as Record<string, unknown> | undefined;
  if (item?.id && typeof detail.score === 'number') {
    const assessed: NormalizedAssessEvent = {
      eid: 'ASSESS',
      ets: typeof e.timestamp === 'number' ? e.timestamp : undefined,
      edata: {
        score: detail.score,
        item,
        resvalues: Array.isArray(detail.resvalues) ? detail.resvalues : [],
        duration: typeof detail.duration === 'number' ? detail.duration : 0,
      },
    };
    return assessed;
  }

  return event;
}
