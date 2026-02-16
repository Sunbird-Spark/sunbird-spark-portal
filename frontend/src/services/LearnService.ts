import { getClient, ApiResponse } from '../lib/http-client';
import { CourseEnrollmentResponse } from '../types/courseTypes';

export class LearnService {
  public async getUserEnrollments(userId: string): Promise<ApiResponse<CourseEnrollmentResponse>> {
    const url = `/learner/course/v1/user/enrollment/list/${userId}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,resourceType,identifier,pkgVersion,trackable,primaryCategory,organisation,board,medium,gradeLevel,subject&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`;
    return getClient().get<CourseEnrollmentResponse>(url);
  }
}
