/**
 * Playback types: calculatePlaybackProgress (endpageseen/visitedcontentend or >20% viewed → 100, else progress).
 * Other (H5P/HTML/ECML): absoluteProgress(progress, 0) → progress >= 0 ? 100 : 0.
 * Rest: absoluteProgress(progress, 100) → progress >= 100 ? 100 : 0.
 */

const PLAYBACK_MIME_TYPES = [
  'video/x-youtube',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/epub',
];

const OTHER_MIME_TYPES = [
  'application/vnd.ekstep.h5p-archive',
  'application/vnd.ekstep.html-archive',
];

export interface ConsumptionSummary {
  progress?: number;
  visitedLength?: number;
  totalLength?: number;
  endpageseen?: boolean;
  visitedcontentend?: boolean;
  [key: string]: unknown;
}

/**
 * Reference: if progress >= threshold return 100, else return 0.
 */
function absoluteProgress(progress: number, threshold: number): number {
  const p = Number(progress);
  if (Number.isNaN(p)) return 0;
  return p >= threshold ? 100 : 0;
}

/**
 * Reference: endPageSeen || visitedContentEnd || (totalLength && (visitedLength*100)/totalLength > 20) → 100, else progress.
 */
function calculatePlaybackProgress(
  progress: number,
  visitedLength: number,
  totalLength: number,
  endPageSeen: boolean,
  visitedContentEnd: boolean
): number {
  if (
    endPageSeen ||
    visitedContentEnd ||
    (totalLength > 0 && (visitedLength * 100) / totalLength > 20)
  ) {
    return 100;
  }
  return progress;
}

function isPlaybackMime(mimeType: string): boolean {
  return PLAYBACK_MIME_TYPES.indexOf(mimeType ?? '') > -1;
}

function isOtherMimeType(mimeType: string): boolean {
  return OTHER_MIME_TYPES.indexOf(mimeType ?? '') > -1;
}

/**
 * Sunbird telemetry summary can be an array of single-key objects (e.g. [{ progress: 100 }, { totallength: 43 }, ...]).
 * Merge into one object like CsContentProgressCalculator.summary.reduce(acc, s) + Object.keys(s).forEach(k => acc[k]=s[k]).
 */
function mergeSummary(summary: ConsumptionSummary[]): ConsumptionSummary {
  if (!Array.isArray(summary) || summary.length === 0) return {};
  return summary.reduce<ConsumptionSummary>(
    (acc, s) => {
      Object.keys(s).forEach((k) => {
        acc[k] = s[k];
      });
      return acc;
    },
    {} as ConsumptionSummary
  );
}

/**
 * Same logic as CsContentProgressCalculator.calculate(summary, mimeType).
 */
export function calculateContentProgress(
  summary: ConsumptionSummary[],
  mimeType: string
): number {
  if (!Array.isArray(summary) || summary.length === 0) return 0;

  const summaryMap = mergeSummary(summary);
  if (summaryMap.progress === undefined || summaryMap.progress === null) return 0;

  const progressNumRaw = Number(summaryMap.progress);
  const progressNum = Number.isNaN(progressNumRaw) ? 0 : progressNumRaw;
  const visitedLength = Number(summaryMap.visitedLength ?? summaryMap.visitedlength ?? 0);
  const totalLength = Number(summaryMap.totalLength ?? summaryMap.totallength ?? 0);
  const endPageSeen = Boolean(summaryMap.endpageseen);
  const visitedContentEnd = Boolean(summaryMap.visitedcontentend);

  if (isPlaybackMime(mimeType)) {
    return calculatePlaybackProgress(
      progressNum,
      visitedLength,
      totalLength,
      endPageSeen,
      visitedContentEnd
    );
  }
  if (isOtherMimeType(mimeType)) {
    return absoluteProgress(progressNum, 0);
  }
  return absoluteProgress(progressNum, 100);
}

/**
 * Maps effective progress (0-100) to content state: 0 = not started, 1 = in progress, 2 = completed.
 */
export function progressToStatus(effectiveProgress: number): 0 | 1 | 2 {
  if (effectiveProgress >= 100) return 2;
  if (effectiveProgress > 0) return 1;
  return 0;
}
