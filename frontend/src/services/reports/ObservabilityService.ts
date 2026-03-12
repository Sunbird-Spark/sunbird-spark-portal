import { getClient } from '../../lib/http-client';
import type { LearnerProgressApiItem, LearnerProgressResult, UserCourseEnrolmentApiItem, UserCourseEnrolmentResult } from '../../types/reports';

/** Shared parser for the Sunbird observability response envelope. */
function parseObservabilityResponse<T>(raw: unknown): { data: T[]; count: number } {
  if (Array.isArray(raw)) return { data: raw as T[], count: (raw as unknown[]).length };
  if (raw !== null && typeof raw === 'object') {
    const asObj = raw as Record<string, unknown>;
    const inner = asObj['response'];
    if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
      const innerObj = inner as Record<string, unknown>;
      const data = Array.isArray(innerObj['data']) ? (innerObj['data'] as T[]) : [];
      const count = typeof innerObj['count'] === 'number' ? innerObj['count'] : data.length;
      return { data, count };
    }
    if (Array.isArray(inner)) return { data: inner as T[], count: (inner as unknown[]).length };
  }
  return { data: [], count: 0 };
}

export class ObservabilityService {
  /**
   * Fetch detailed learner progress for a given course and batch.
   * POST /observability/v1/reports
   */
  public getLearnerProgress(
    courseId: string,
    batchId: string
  ): Promise<LearnerProgressResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'course-batch-enrolments',
          filters: {
            courseid: courseId,
            batchid: batchId,
          },
          transform: ['userid'],
        },
      })
      .then((response) => parseObservabilityResponse<LearnerProgressApiItem>(response.data));
  }

  /**
   * Fetch all course enrolments for a given user.
   * POST /observability/v1/reports
   */
  public getUserCourseEnrolments(userId: string): Promise<UserCourseEnrolmentResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'user-course-enrolments',
          filters: { userid: userId },
          transform: ['courseid'],
        },
      })
      .then((response) => parseObservabilityResponse<UserCourseEnrolmentApiItem>(response.data));
  }
}

export const observabilityService = new ObservabilityService();
