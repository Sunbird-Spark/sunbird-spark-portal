import { getClient, ApiResponse } from '../../lib/http-client';
import type {
  CourseHierarchyResponse,
  BatchListResponse,
  BatchReadResponse,
  ContentStateReadRequest,
  ContentStateReadResponse,
} from '../../types/collectionTypes';

export class CollectionService {
  public async getHierarchy(identifier: string): Promise<ApiResponse<CourseHierarchyResponse>> {
    return getClient().get<CourseHierarchyResponse>(`/course/v1/hierarchy/${identifier}`);
  }

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
    return getClient().post<ContentStateReadResponse>('/course/v1/content/state/read', {
      request: {
        userId: request.userId,
        courseId: request.courseId,
        batchId: request.batchId,
        contentIds: request.contentIds,
      },
    });
  }
}
