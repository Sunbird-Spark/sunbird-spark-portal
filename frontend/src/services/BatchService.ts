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

export interface CreateBatchRequest {
  courseId: string;
  name: string;
  description?: string;
  enrollmentType: 'open';
  startDate: string;
  endDate: string;
  createdBy: string;
  createdFor: string[];
  mentors?: string[];
  tandc: boolean;
  enrollmentEndDate?: string;
}

export interface CreateBatchResponse {
  batchId: string;
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

  async createBatch(
    request: CreateBatchRequest
  ): Promise<ApiResponse<CreateBatchResponse>> {
    return getClient().post<CreateBatchResponse>('/learner/course/v1/batch/create', {
      request,
    });
  }
}

export const batchService = new BatchService();
