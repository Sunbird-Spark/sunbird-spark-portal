import type {
  CollectionData,
  ContentStateItem,
  CertTemplate,
  BatchListItem,
  HierarchyContentNode,
} from '../../types/collectionTypes';
import { BATCH_STATUS } from '../../types/collectionTypes';
import type { TrackableCollection } from '../../types/TrackableCollections';
import { getLeafContentIdsFromHierarchy } from './hierarchyTree';

/** Filter to batches that are enrollable: status Ongoing/Upcoming and enrollment end date not passed (or null). Uses current time for enrollmentEndDate. */
export function getEnrollableBatches(
  batches: BatchListItem[] | undefined,
  now: Date = new Date()
): BatchListItem[] {
  if (!batches?.length) return [];
  const nowMs = now.getTime();
  return batches.filter((b) => {
    if (b.status !== BATCH_STATUS.Ongoing && b.status !== BATCH_STATUS.Upcoming) return false;
    if (b.enrollmentEndDate == null || b.enrollmentEndDate === '') return true;
    const endMs = new Date(b.enrollmentEndDate).getTime();
    return Number.isFinite(endMs) && endMs >= nowMs;
  });
}

/** Format batch date for display; returns "-" if missing or invalid. */
export function formatBatchDisplayDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr === '') return '-';
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getEnrollmentForCollection(
  courses: TrackableCollection[] | undefined,
  collectionId: string | undefined
): TrackableCollection | undefined {
  if (!collectionId || !courses?.length) return undefined;
  return courses.find(
    (c) =>
      c.courseId === collectionId ||
      c.contentId === collectionId ||
      (c as { collectionId?: string }).collectionId === collectionId
  );
}


export function getLeafContentIds(collectionData: CollectionData | null): string[] {
  if (!collectionData?.hierarchyRoot) return [];
  return getLeafContentIdsFromHierarchy(collectionData.hierarchyRoot);
}

export function getContentStatusMap(contentList: ContentStateItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  contentList.forEach((item) => {
    if (item.contentId != null && item.status !== undefined) map[item.contentId] = item.status;
  });
  return map;
}

/** Whether the hierarchy node is SelfAssess (quiz) — attempt limits apply only to these. */
export function isSelfAssess(node: HierarchyContentNode | null | undefined): boolean {
  return (node?.contentType ?? '') === 'SelfAssess';
}

export interface ContentScoreInfo {
  totalScore: number;
  totalMaxScore: number;
}

export interface ContentAttemptInfo {
  attemptCount: number;
  bestScore?: ContentScoreInfo;
}

/** Map contentId -> { attemptCount, bestScore } from content state (score.length = currentAttempts). */
export function getContentAttemptInfoMap(contentList: ContentStateItem[]): Record<string, ContentAttemptInfo> {
  const map: Record<string, ContentAttemptInfo> = {};
  contentList.forEach((item) => {
    if (item.contentId == null) return;
    const score = item.score;
    const attemptCount = Array.isArray(score) ? score.length : 0;
    const entry: ContentAttemptInfo = { attemptCount };
    if (Array.isArray(score) && score.length > 0) {
      let best: ContentScoreInfo | undefined;
      for (const s of score) {
        const attempt = s as { totalScore?: number; totalMaxScore?: number } | undefined;
        if (attempt && typeof attempt.totalScore === 'number' && typeof attempt.totalMaxScore === 'number') {
          if (!best || attempt.totalScore > best.totalScore) {
            best = { totalScore: attempt.totalScore, totalMaxScore: attempt.totalMaxScore };
          }
        }
      }
      if (best) entry.bestScore = best;
    }
    map[item.contentId] = entry;
  });
  return map;
}

export interface CourseProgressProps {
  batchStartDate?: string;
  totalContentCount: number;
  completedContentCount: number;
}

export function getCourseProgressProps(
  enrollment: TrackableCollection | undefined,
  collectionData: CollectionData | null,
  totalFromState: number,
  completedFromState: number
): CourseProgressProps | null {
  if (!enrollment || !collectionData) return null;
  const total =
    totalFromState ||
    collectionData.lessons ||
    enrollment.leafNodesCount ||
    0;
  const completed =
    totalFromState > 0
      ? completedFromState
      : enrollment.contentStatus && typeof enrollment.contentStatus === 'object'
        ? Object.values(enrollment.contentStatus).filter((s) => s === 2).length
        : total > 0
          ? Math.round(((enrollment.completionPercentage ?? 0) / 100) * total)
          : 0;
  return {
    batchStartDate: enrollment.batch?.startDate,
    totalContentCount: total,
    completedContentCount: completed,
  };
}

export function getFirstCertPreviewUrl(
  certTemplates: Record<string, CertTemplate> | undefined
): string | undefined {
  if (!certTemplates || typeof certTemplates !== 'object') return undefined;
  const first = Object.values(certTemplates)[0];
  return first?.previewUrl;
}
