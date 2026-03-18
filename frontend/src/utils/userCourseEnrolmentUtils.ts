import type { UserAssessmentApiItem, UserAssessmentHistory, UserCourseEnrolmentApiItem, UserCourseProgress } from '@/types/reports';
import { toRelativeTime } from '@/utils/dateUtils';

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
    courseName: item.collectionDetails?.name ?? '—',
    progressPercent: item.completionpercentage ?? 0,
    status: STATUS_MAP[item.status] ?? 'Not Started',
    enrollmentDate: toDateOnly(item.enrolled_date),
    lastAccessed: toRelativeTime(item.datetime),
  };
}

export function mapApiItemToUserAssessmentHistory(
  item: UserAssessmentApiItem
): UserAssessmentHistory {
  const score = item.total_score ?? 0;
  const maxScore = item.total_max_score ?? 0;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return {
    id: item.attempt_id,
    courseName: item.collectionDetails?.name ?? '—',
    assessmentName: item.contentDetails?.name ?? '—',
    score,
    maxScore,
    percentage,
    attemptDate: item.last_attempted_on.slice(0, 16).replace('T', ' '),
  };
}
