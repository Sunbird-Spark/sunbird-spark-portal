import { getClient, ApiResponse } from '../lib/http-client';

export interface Certificate {
  osid: string;
  osUpdatedAt: string;
  osCreatedAt: string;
  recipient: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  issuer: {
    url: string;
    name: string;
    [key: string]: unknown;
  };
  training: {
    id: string;
    name: string;
    type: string;
    batchId: string;
    [key: string]: unknown;
  };
  templateUrl: string;
  status: string;
  certificateLabel: string;
  [key: string]: unknown;
}

export type CertificateSearchResponse = Certificate[];

export class CertificateService {
  public async searchCertificates(userId: string): Promise<ApiResponse<CertificateSearchResponse>> {
    return getClient().post<CertificateSearchResponse>('/rc/certificate/v1/search', {
      filters: {
        recipient: {
          id: {
            eq: userId,
          },
        },
      },
    });
  }
}

export const certificateService = new CertificateService();
