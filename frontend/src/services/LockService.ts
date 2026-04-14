import { getClient, ApiResponse } from '../lib/http-client';

export interface LockCreateRequest {
  resourceId: string;
  resourceType: string;
  resourceInfo: string;
  creatorInfo: string;
  createdBy: string;
  isRootOrgAdmin?: boolean;
}

export interface LockCreateResponse {
  lockKey: string;
  expiresAt: string;
  expiresIn: number;
}

export interface LockListItem {
  lockId: string;
  resourceId: string;
  resourceType: string;
  resourceInfo: string;
  createdBy: string;
  creatorInfo: string;
  createdOn: string;
  deviceId: string;
  expiresAt: string;
}

export interface LockListResponse {
  count: number;
  data: LockListItem[];
}

export class LockService {
  public async createLock(request: LockCreateRequest): Promise<ApiResponse<LockCreateResponse>> {
    return getClient().post<LockCreateResponse>('/lock/v1/create', {
      request,
    });
  }

  public async listLocks(resourceIds: string[]): Promise<ApiResponse<LockListResponse>> {
    return getClient().post<LockListResponse>('/lock/v1/list', {
      request: {
        filters: { resourceId: resourceIds },
      },
    });
  }

  public async retireLock(resourceId: string, resourceType = 'Content'): Promise<ApiResponse<void>> {
    return getClient().delete<void>('/lock/v1/retire', {
      request: { resourceId, resourceType },
    });
  }
}

export const lockService = new LockService();
