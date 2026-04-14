import { getClient, ApiResponse } from '../lib/http-client';

export interface OrganizationSearchRequest {
  filters: {
    slug?: string;
    isTenant?: boolean;
    [key: string]: any;
  };
}

export interface Organization {
  identifier: string;
  id: string;
  slug: string;
  channel?: string;
  hashTagId?: string;
  orgName?: string;
}

export class OrganizationService {
  /**
   * Search organizations via Kong proxy
   * This goes through: /portal/org/v2/search → Kong → Sunbird
   */
  public async search(request: OrganizationSearchRequest): Promise<ApiResponse<any>> {
    return getClient().post('/org/v2/search', { request });
  }
}
