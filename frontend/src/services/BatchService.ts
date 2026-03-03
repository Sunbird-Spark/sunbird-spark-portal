import { getClient, ApiResponse } from '../lib/http-client';

export interface Batch {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  /** "0" = Upcoming, "1" = Ongoing, "2" = Expired */
  status: string;
  startDate: string;
  endDate: string;
  enrollmentEndDate?: string;
  enrollmentType?: string;
  /** If present and non-empty, the batch already has a certificate template */
  certTemplates?: Record<string, unknown>;
  /** Whether certificate issuance is enabled for this batch */
  issueCertificate?: boolean;
  mentors?: string[];
  createdBy?: string;
  createdDate?: string;
  createdFor?: string[];
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
  issueCertificate?: boolean;
}

export interface UpdateBatchRequest {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  enrollmentType: 'open';
  startDate: string;
  endDate: string;
  createdFor: string[];
  mentors: string[];
  enrollmentEndDate?: string;
  issueCertificate?: boolean;
}

export interface CreateBatchResponse {
  batchId: string;
}

export class BatchService {
  async listBatches(
    courseId: string,
    createdBy: string
  ): Promise<ApiResponse<BatchListResponse>> {
    return getClient().post<BatchListResponse>('/course/v1/batch/list', {
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
    request: CreateBatchRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<CreateBatchResponse>> {
    return getClient().post<CreateBatchResponse>(
      '/course/v1/batch/create',
      { request },
      headers
    );
  }

  async updateBatch(
    request: UpdateBatchRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<unknown>> {
    return getClient().patch<unknown>(
      '/course/v1/batch/update',
      { request },
      headers
    );
  }
}

export const batchService = new BatchService();
