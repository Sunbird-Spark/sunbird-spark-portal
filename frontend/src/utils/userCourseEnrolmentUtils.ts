import type { UserCourseEnrolmentApiItem, UserCourseProgress } from '@/types/reports';

const STATUS_MAP: Record<number, UserCourseProgress['status']> = {
  0: 'Not Started',
  1: 'In Progress',
  2: 'Completed',
};

/** Extract YYYY-MM-DD from an ISO datetime string */
function toDateOnly(isoString: string): string {
  return isoString.slice(0, 10);
}

export function mapApiItemToUserCourseProgress(
  item: UserCourseEnrolmentApiItem
): UserCourseProgress {
  return {
    id: item.courseid,
    courseName: item.collectionDetails.name,
    progressPercent: item.completionpercentage ?? 0,
    status: STATUS_MAP[item.status] ?? 'Not Started',
    enrollmentDate: toDateOnly(item.enrolled_date),
    lastAccessed: toDateOnly(item.datetime),
  };
}
