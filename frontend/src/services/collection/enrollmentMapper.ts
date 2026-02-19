import type { CollectionData, ContentStateItem, CertTemplate } from '../../types/collectionTypes';
import type { TrackableCollection } from '../../types/TrackableCollections';

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
  if (!collectionData?.modules) return [];
  return collectionData.modules.flatMap((m) => m.lessons.map((l) => l.id));
}

export function getContentStatusMap(contentList: ContentStateItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  contentList.forEach((item) => {
    if (item.contentId != null && item.status !== undefined) map[item.contentId] = item.status;
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
