import { getClient, ApiResponse } from '../../lib/http-client';
import type {
  ConsentReadRequest,
  ConsentReadResponse,
  ConsentUpdateRequest,
  ConsentUpdateResponse,
} from '../../types/consentTypes';

export class ConsentService {
  async read(request: ConsentReadRequest): Promise<ApiResponse<ConsentReadResponse>> {
    return getClient().post<ConsentReadResponse>('/user/v1/consent/read', {
      request: {
        consent: {
          filters: {
            userId: request.userId,
            consumerId: request.consumerId,
            objectId: request.objectId,
          },
        },
      },
    });
  }

  async update(request: ConsentUpdateRequest): Promise<ApiResponse<ConsentUpdateResponse>> {
    return getClient().post<ConsentUpdateResponse>('/user/v1/consent/update', {
      request: {
        consent: {
          status: request.status,
          userId: request.userId,
          consumerId: request.consumerId,
          objectId: request.objectId,
          objectType: request.objectType,
        },
      },
    });
  }
}

export const consentService = new ConsentService();
