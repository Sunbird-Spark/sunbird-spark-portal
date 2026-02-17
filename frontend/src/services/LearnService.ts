import { getClient, ApiResponse } from '../lib/http-client';
import { CourseEnrollmentResponse } from '../types/courseTypes';

const ORG_DETAILS_FIELDS = ['orgName', 'email'] as const;
const LICENSE_DETAILS_FIELDS = ['name', 'description', 'url'] as const;
const ENROLLMENT_CONTENT_FIELDS = [
  'contentType',
  'topic',
  'name',
  'channel',
  'mimeType',
  'appIcon',
  'resourceType',
  'identifier',
  'pkgVersion',
  'trackable',
  'primaryCategory',
  'organisation',
  'board',
  'medium',
  'gradeLevel',
  'subject',
] as const;
const BATCH_DETAILS_FIELDS = [
  'name',
  'endDate',
  'startDate',
  'status',
  'enrollmentType',
  'createdBy',
  'certificates',
] as const;

export class LearnService {
  public async getUserEnrollments(userId: string): Promise<ApiResponse<CourseEnrollmentResponse>> {
    const searchParams = new URLSearchParams({
      orgdetails: ORG_DETAILS_FIELDS.join(','),
      licenseDetails: LICENSE_DETAILS_FIELDS.join(','),
      fields: ENROLLMENT_CONTENT_FIELDS.join(','),
      batchDetails: BATCH_DETAILS_FIELDS.join(','),
    });
    const url = `/learner/course/v1/user/enrollment/list/${userId}?${searchParams.toString()}`;
    return getClient().get<CourseEnrollmentResponse>(url);
  }
}
