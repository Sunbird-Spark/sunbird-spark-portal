import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { certificateService } from '../services/CertificateService';
import { CertUserSearchResponse, CertUserBatch } from '../services/CertificateTypes';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import { userService } from '../services/UserService';
import { TrackableCollection, IssuedCertificate } from '../types/TrackableCollections';

// ─── helpers ─────────────────────────────────────────────────────────────────
async function resolveCreatedBy(): Promise<string> {
  let userId = userAuthInfoService.getUserId();
  if (!userId) {
    const info = await userAuthInfoService.getAuthInfo();
    userId = info?.uid ?? null;
  }
  if (!userId) throw new Error('User is not authenticated');
  return userId;
}

// ─── Params ──────────────────────────────────────────────────────────────────
export interface CertUserSearchParams {
  userName: string;
  courseId: string;
}

export interface ReissueCertParams {
  courseId: string;
  batchId: string;
  userIds: string[];
}

// ─── useCertUserSearch ────────────────────────────────────────────────────────
/**
 * Mutation: search for a user's certificate status by Unique ID (userName).
 * 1. Calls /user/v3/search to find the internal userId.
 * 2. Calls /course/v1/user/enrollment/list/:userId to get enrollments.
 * 3. Filters to the given courseId and maps to the expected CertUserSearchResponse.
 */
export const useCertUserSearch = (): UseMutationResult<
  ApiResponse<CertUserSearchResponse>,
  Error,
  CertUserSearchParams
> => {
  return useMutation({
    mutationFn: async ({ userName, courseId }: CertUserSearchParams) => {
      // 1. Resolve user ID from userName
      const searchRes = await userService.searchUserByUserName(userName);
      const content = searchRes.data?.response?.content;
      if (!content || content.length === 0) {
        throw new Error('User not found');
      }
      
      const targetUser = content[0];
      const userId = targetUser.id;
      const resolvedUserName = targetUser.userName || userName;

      // 2. Fetch enrollments for the user using the private endpoint
      const enrollRes = await userService.getPrivateUserEnrollments(userId);
      const courses: TrackableCollection[] = enrollRes.data?.courses || [];

      // 3. Filter enrollments for the specific course and map to expected structure
      const courseEnrollments = courses.filter((c: TrackableCollection) => c.courseId === courseId);
      
      const batches: CertUserBatch[] = courseEnrollments.map((enr: TrackableCollection) => {
        let issuedCertificates: IssuedCertificate[] = [];
        if (enr.issuedCertificates && enr.issuedCertificates.length > 0) {
            issuedCertificates = enr.issuedCertificates;
        } else if (enr.certificates && enr.certificates.length > 0) {
            issuedCertificates = enr.certificates;
        }

        return {
          batchId: enr.batchId,
          name: enr.batch?.name || enr.courseName || 'Unknown Batch',
          courseId: enr.courseId,
          completionPercentage: enr.completionPercentage || 0,
          status: enr.status,
          issuedCertificates: issuedCertificates,
          batch: enr.batch ? { batchId: enr.batch.batchId, name: enr.batch.name, createdBy: enr.batch.createdBy } : undefined,
          completedOn: enr.completedOn,
          enrolledDate: enr.enrolledDate,
        };
      });

      // Assemble mock API response wrapper
      const firstEnrollment = courseEnrollments.length > 0 ? courseEnrollments[0] : null;

      const responsePayload: CertUserSearchResponse = {
        response: {
          userId: userId,
          userName: resolvedUserName,
          courses: {
            courseId: courseId,
            name: firstEnrollment?.courseName || 'Course',
            contentType: firstEnrollment?.content?.contentType || 'Course',
            batches: batches,
          }
        }
      };

      return {
        data: responsePayload,
        status: 200,
        headers: {},
      };
    },
  });
};

// ─── useReissueCert ───────────────────────────────────────────────────────────
/**
 * Mutation: re-issue a certificate for one or more users.
 * Resolves the current user's id and calls POST /certreg/v1/cert/reissue.
 */
export const useReissueCert = (): UseMutationResult<
  ApiResponse<unknown>,
  Error,
  ReissueCertParams
> => {
  return useMutation({
    mutationFn: async ({ courseId, batchId, userIds }: ReissueCertParams) => {
      const createdBy = await resolveCreatedBy();
      return certificateService.reissueCertificate({
        courseId,
        batchId,
        userIds,
        createdBy,
      });
    },
  });
};
