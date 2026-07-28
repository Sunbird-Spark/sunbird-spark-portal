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
export function eventHasScore(event: TelemetryEvent | undefined): boolean {
  if (!event) return false;
  const raw = event?.data ?? event;
  if (typeof raw === "string") return false;
  const rawData = raw as Record<string, unknown>;
  if (isNumericScore((rawData?.edata as { score?: unknown } | undefined)?.score)) return true;
  if (isNumericScore((rawData as { score?: unknown })?.score)) return true;
  const summary = (rawData?.edata as any)?.summary ?? (rawData as any)?.summary;
  const arr = Array.isArray(summary) ? summary : summary ? [summary] : [];
  return arr.some((s) => isNumericScore((s as ConsumptionSummary & { score?: unknown })?.score));
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

/**
 * SCORM API values (score, maxscore) are always strings per spec. The backend's
 * bestScore aggregation expects real numbers (as QUML's normalizer already
 * provides) - coerce them here before the event is accumulated/sent, so a
 * string score/maxscore doesn't silently break server-side totalScore math.
 */
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
