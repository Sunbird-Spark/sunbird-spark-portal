import { getClient } from '../../lib/http-client';
import type { AssessmentApiItem, AssessmentResult, ContentStatusSummaryApiResult, ContentStatusSummaryFacet, LearnerProgressApiItem, LearnerProgressResult, OrgCourseEnrolmentApiItem, OrgCourseEnrolmentResult, UserAssessmentApiItem, UserAssessmentResult, UserConsentApiItem, UserConsentSummaryResult, UserCourseEnrolmentApiItem, UserCourseEnrolmentResult, UserCreationCountApiItem, UserCreationCountResult } from '../../types/reports';

/** Shared parser for the Sunbird observability response envelope.
 *  Handles two response shapes:
 *  - { response: { data: [], count: N } }          (flat)
 *  - { result: { response: { data: [], count: N } } } (wrapped)
 */
function parseObservabilityResponse<T>(raw: unknown): { data: T[]; count: number } {
  if (Array.isArray(raw)) return { data: raw as T[], count: (raw as unknown[]).length };
  if (raw !== null && typeof raw === 'object') {
    const asObj = raw as Record<string, unknown>;
    // Handle result.response wrapper (e.g. course-assessment-summary)
    const resultObj = asObj['result'];
    const inner =
      (resultObj !== null && typeof resultObj === 'object' && !Array.isArray(resultObj))
        ? (resultObj as Record<string, unknown>)['response']
        : asObj['response'];
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

  /**
   * Fetch assessment summary for all learners in a course.
   * POST /observability/v1/reports
   */
  public getCourseAssessments(courseId: string): Promise<AssessmentResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'course-assessment-summary',
          filters: { courseid: courseId },
          transform: ['user_id'],
        },
      })
      .then((response) => parseObservabilityResponse<AssessmentApiItem>(response.data));
  }

  /**
   * Fetch assessment history for a given user.
   * POST /observability/v1/reports
   */
  public getUserAssessments(userId: string): Promise<UserAssessmentResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'user-assessment-summary',
          filters: { userid: userId },
          transform: ['course_id', 'content_id'],
        },
      })
      .then((response) => parseObservabilityResponse<UserAssessmentApiItem>(response.data));
  }

  /**
   * Fetch content status summary for an org (facets: status, createdBy, primaryCategory).
   * POST /observability/v1/reports
   */
  public getContentStatusSummary(orgId: string): Promise<ContentStatusSummaryApiResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'content-status-summary',
          filters: { createdFor: orgId },
          transform: ['createdBy'],
        },
      })
      .then((response) => parseObservabilityResponse<ContentStatusSummaryFacet>(response.data));
  }

  /**
   * Fetch monthly user creation counts.
   * POST /observability/v1/reports
   */
  public getUserCreationCount(): Promise<UserCreationCountResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: { reportId: 'user-creation-count', filters: {} },
      })
      .then((response) => parseObservabilityResponse<UserCreationCountApiItem>(response.data));
  }

  /**
   * Fetch enrolment summary for all courses in an org.
   * POST /observability/v1/reports
   */
  public getOrgCourseEnrolmentSummary(courseIds: string[]): Promise<OrgCourseEnrolmentResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'org-course-enrolment-summary',
          filters: { courseids: courseIds },
          transform: ['course_id'],
        },
      })
      .then((response) => parseObservabilityResponse<OrgCourseEnrolmentApiItem>(response.data));
  }

  /**
   * Fetch user consent summary.
   * POST /observability/v1/reports
   */
  public getConsentSummary(): Promise<UserConsentSummaryResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'user-consent-summary',
          filters: {},
          transform: ['user_id', 'object_id'],
        },
      })
      .then((response) => parseObservabilityResponse<UserConsentApiItem>(response.data));
  }
}

export const observabilityService = new ObservabilityService();
