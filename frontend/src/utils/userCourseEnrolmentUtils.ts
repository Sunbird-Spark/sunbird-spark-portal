import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { UserAssessmentApiItem, UserAssessmentHistory, UserCourseEnrolmentApiItem, UserCourseProgress } from '@/types/reports';
import { toRelativeTime } from '@/utils/dateUtils';

dayjs.extend(utc);

const STATUS_MAP: Record<number, UserCourseProgress['status']> = {
  0: 'Not Started',
  1: 'In Progress',
  2: 'Completed',
};

export function mapApiItemToUserCourseProgress(
  item: UserCourseEnrolmentApiItem
): UserCourseProgress {
  return {
    id: item.courseid,
    courseName: item.collectionDetails?.name ?? '—',
    progressPercent: item.completionpercentage ?? 0,
    status: STATUS_MAP[item.status] ?? 'Not Started',
    enrollmentDate: dayjs(item.enrolled_date).format('YYYY-MM-DD'),
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
    attemptDate: dayjs.utc(item.last_attempted_on).format('YYYY-MM-DD HH:mm'),
  };
}
