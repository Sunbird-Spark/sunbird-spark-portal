import type { ConsumptionSummary } from "../services/collection/contentProgressCalculator";

/** Telemetry callback receives the raw player detail (e.g. { eid, edata }), not { type, data }. */
export type TelemetryEvent = {
  eid?: string;
  type?: string;
  actor?: { id?: string };
  ets?: number;
  edata?: { summary?: ConsumptionSummary[]; score?: number | string; endpageseen?: boolean; [key: string]: unknown };
  summary?: ConsumptionSummary | ConsumptionSummary[];
  data?: string | {
    eid?: string;
    actor?: { id?: string };
    ets?: number;
    edata?: { summary?: ConsumptionSummary[]; score?: number | string; [key: string]: unknown };
    summary?: ConsumptionSummary | ConsumptionSummary[];
    score?: number | string;
    [key: string]: unknown;
  };
};

/** True when a value is a real numeric score, coercing SCORM's string-typed API values (e.g. "95"). */
function isNumericScore(value: unknown): boolean {
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string" && value.trim() !== "") return !Number.isNaN(parseFloat(value));
  return false;
}

/** True when the event carries a score (submit), e.g. ASSESS with edata.score or summary score. */
export function eventHasScore(event: TelemetryEvent | undefined, isScorm: boolean): boolean {
  if (!event) return false;
  const raw = event?.data ?? event;
  if (typeof raw === "string") return false;
  const rawData = raw as Record<string, unknown>;
  const hasScore = (value: unknown): boolean =>
    isScorm ? isNumericScore(value) : typeof value === "number" && !Number.isNaN(value);
  if (hasScore((rawData?.edata as { score?: unknown } | undefined)?.score)) return true;
  if (hasScore((rawData as { score?: unknown })?.score)) return true;
  const summary = (rawData?.edata as any)?.summary ?? (rawData as any)?.summary;
  const arr = Array.isArray(summary) ? summary : summary ? [summary] : [];
  return arr.some((s) => hasScore((s as ConsumptionSummary & { score?: unknown })?.score));
}

export function extractSummary(event: TelemetryEvent): ConsumptionSummary[] {
  const raw = event?.data ?? event;
  if (typeof raw === "string") return [];
  const rawData = raw as any;
  const rawSummary = rawData?.edata?.summary ?? rawData?.summary;
  return Array.isArray(rawSummary) ? rawSummary : rawSummary ? [rawSummary] : [];
}

function toNumber(value: unknown): unknown {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return value;
}

export function normalizeScormAssessEvent(event: unknown): unknown {
  if (!event || typeof event !== "object") return event;
  const e = event as Record<string, unknown>;
  const edata = e.edata as Record<string, unknown> | undefined;
  if (!edata) return event;
  const item = edata.item as Record<string, unknown> | undefined;
  return {
    ...e,
    edata: {
      ...edata,
      score: toNumber(edata.score),
      ...(item && { item: { ...item, maxscore: toNumber(item.maxscore) } }),
    },
  };
}

/**
 * Sum an attempt's accumulated ASSESS events into attempt totals.
 *
 * The Viewer Service's `/v1/assessment/submit` receives the raw ASSESS events,
 * but sending explicit totals alongside them means neither the service nor the
 * UI has to re-derive them. Mirrors how the legacy course service aggregates
 * `content/state/update` assessments: total score is the sum of `edata.score`
 * and total max is the sum of `edata.item.maxscore`.
 */
export function sumAssessEventTotals(events: unknown[]): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;
  events.forEach((event) => {
    if (!event || typeof event !== "object") return;
    const edata = (event as { edata?: Record<string, unknown> }).edata;
    if (!edata) return;
    const eventScore = toNumber(edata.score);
    if (typeof eventScore === "number") score += eventScore;
    const item = edata.item as { maxscore?: unknown } | undefined;
    const eventMax = toNumber(item?.maxscore);
    if (typeof eventMax === "number") maxScore += eventMax;
  });
  return { score, maxScore };
}
