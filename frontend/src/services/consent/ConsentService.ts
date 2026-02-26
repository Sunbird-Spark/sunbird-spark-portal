import { getClient, ApiResponse } from '../../lib/http-client';
import type {
  ConsentReadRequest,
  ConsentReadResponse,
  ConsentUpdateRequest,
  ConsentUpdateResponse,
} from '../../types/consentTypes';

/**
 * Service for learner PII consent (course-level: share profile with course administrators).
 * APIs: POST /user/v1/consent/read, POST /user/v1/consent/update.
 * Payload must be wrapped as per Sunbird API: request.consent (update) and request.consent.filters (read).
 */
export class ConsentService {
  /**
   * Get consent status for a user + course (consumerId = course channel, objectId = course identifier).
   * Returns 404 when no consent record exists yet.
   * Sends body: { request: { consent: { filters: { userId, consumerId, objectId } } } }
   */
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

  /**
   * Update consent (ACTIVE = share, REVOKED = do not share).
   * For course consent, objectType must be 'Collection'.
   * Sends body: { request: { consent: { status, userId, consumerId, objectId, objectType } } }
   */
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
