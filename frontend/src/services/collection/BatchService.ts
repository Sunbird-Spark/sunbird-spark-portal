import { getClient, ApiResponse } from '../../lib/http-client';
import type {
  BatchListResponse,
  BatchReadResponse,
  ContentStateReadRequest,
  ContentStateReadResponse,
  ContentStateUpdateRequest,
} from '../../types/collectionTypes';

export class BatchService {
  public batchList(courseId: string): Promise<ApiResponse<BatchListResponse>> {
    return getClient().post<BatchListResponse>('/course/v1/batch/list', {
      request: { filters: { courseId } },
    });
  }

  public batchRead(batchId: string): Promise<ApiResponse<BatchReadResponse>> {
    return getClient().get<BatchReadResponse>(`/course/v1/batch/read/${batchId}`);
  }

  public enrol(courseId: string, userId: string, batchId: string): Promise<ApiResponse<unknown>> {
    return getClient().post('/course/v1/enrol', {
      request: { courseId, userId, batchId },
    });
  }

  public contentStateRead(
    request: ContentStateReadRequest
  ): Promise<ApiResponse<ContentStateReadResponse>> {
    const body: Record<string, unknown> = {
      userId: request.userId,
      courseId: request.courseId,
      batchId: request.batchId,
      contentIds: request.contentIds,
    };
    if (request.fields?.length) {
      body.fields = request.fields;
    }
    return getClient().post<ContentStateReadResponse>('/course/v1/content/state/read', {
      request: body,
    });
  }

  public contentStateUpdate(
    request: ContentStateUpdateRequest
  ): Promise<ApiResponse<unknown>> {
    const contents = request.contents.map((item) => ({
      contentId: item.contentId,
      status: item.status,
      courseId: request.courseId,
      batchId: request.batchId,
      ...(item.lastAccessTime != null && { lastAccessTime: item.lastAccessTime }),
    }));
    const body: Record<string, unknown> = {
      userId: request.userId,
      contents,
    };
    if (request.assessments?.length) {
      body.assessments = request.assessments;
    }
    return getClient().patch<unknown>('/course/v1/content/state/update', {
      request: body,
    });
  }
}
