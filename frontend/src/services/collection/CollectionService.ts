import { getClient, ApiResponse } from '../../lib/http-client';
import type { CourseHierarchyResponse } from '../../types/collectionTypes';

export class CollectionService {
  public async getHierarchy(identifier: string): Promise<ApiResponse<CourseHierarchyResponse>> {
    return getClient().get<CourseHierarchyResponse>(`/course/v1/hierarchy/${identifier}`);
  }
}
