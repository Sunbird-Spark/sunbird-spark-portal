import { getClient, ApiResponse } from '../lib/http-client';

export interface Batch {
  id: string;
  courseId: string;
  name: string;
  /** "0" = Upcoming, "1" = Ongoing, "2" = Expired */
  status: string;
  startDate: string;
  endDate: string;
  enrollmentEndDate?: string;
  /** If present and non-empty, the batch already has a certificate template */
  certTemplates?: Record<string, unknown>;
  createdBy?: string;
  createdDate?: string;
}

export interface BatchListResponse {
  response: {
    content: Batch[];
    count: number;
  };
}

export class BatchService {
  async listBatches(
    courseId: string,
    createdBy: string
  ): Promise<ApiResponse<BatchListResponse>> {
    return getClient().post<BatchListResponse>('/learner/course/v1/batch/list', {
      request: {
        filters: {
          courseId,
          status: ['0', '1', '2'],
          createdBy,
        },
        sort_by: { createdDate: 'desc' },
      },
    });
  }
}

export const batchService = new BatchService();
