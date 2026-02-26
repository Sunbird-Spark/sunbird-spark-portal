import { getClient, ApiResponse } from '../lib/http-client';
import type { Certificate, CertificateSearchResponse } from '../components/collection/certificate/types';
import {
  CertSignatory,
  CertTemplateSummary,
  CreateAssetRequest,
  AssetCreateResponse,
  AddTemplateRequest,
  RemoveTemplateRequest,
} from './CertificateTypes';

export type {
  Certificate,
  CertificateSearchResponse,
  CertSignatory,
  CertTemplateSummary,
  CreateAssetRequest,
  AssetCreateResponse,
  AddTemplateRequest,
  RemoveTemplateRequest,
};

export class CertificateService {
  /** Create the certificate asset record (SVG template) */
  async createAsset(
    assetData: CreateAssetRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<AssetCreateResponse>> {
    return getClient().post<AssetCreateResponse>(
      '/asset/v1/create',
      { request: { asset: assetData } },
      headers
    );
  }

  /** Create a generic image asset record (for logo/signature prior to upload) */
  async createImageAsset(
    name: string,
    mimeType: string,
    channel: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<AssetCreateResponse>> {
    return getClient().post<AssetCreateResponse>(
      '/asset/v1/create',
      {
        request: {
          asset: {
            name,
            code: name,
            mimeType,
            license: 'CC BY 4.0',
            primaryCategory: 'Asset',
            mediaType: 'image',
            channel,
          },
        },
      },
      headers
    );
  }

  /** Upload an SVG file to the created asset */
  async uploadAsset(
    assetId: string,
    svgBlob: Blob,
    fileName: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<{ artifactUrl: string; content_url: string }>> {
    return this._uploadFile(assetId, svgBlob, fileName, headers);
  }

  /** Upload a PNG/JPG image asset (logo or signature) */
  async uploadImageAsset(
    assetId: string,
    imageFile: File | Blob,
    fileName: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<{ artifactUrl: string; content_url: string }>> {
    return this._uploadFile(assetId, imageFile, fileName, headers);
  }

  /** Removes CRLF characters to prevent header injection */
  private _sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      sanitized[key] = value.replace(/[\r\n]/g, '');
    }
    return sanitized;
  }

  private async _uploadFile(
    assetId: string,
    file: File | Blob,
    fileName: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<{ artifactUrl: string; content_url: string }>> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    const sanitizedHeaders = this._sanitizeHeaders(headers);

    try {
      const response = await getClient().post<{ artifactUrl: string; content_url: string }>(
        `/asset/v1/upload/${assetId}`,
        formData,
        sanitizedHeaders
      );
      
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Upload failed');
      }
      throw new Error('Upload failed');
    }
  }

  /** Attach the certificate template to the batch */
  async addTemplateToBatch(
    request: AddTemplateRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<unknown>> {
    return getClient().patch<unknown>(
      'course/batch/cert/v1/template/add',
      { request },
      headers
    );
  }

  /** Remove the certificate template from the batch */
  async removeTemplateFromBatch(
    request: RemoveTemplateRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<unknown>> {
    return getClient().patch<unknown>(
      'course/batch/cert/v1/template/remove',
      { request },
      headers
    );
  }

  /** Search for image assets (logos/signatures already uploaded) in the org.
   *  Pass `createdBy` to filter to the current user's own uploads (My Images tab).
   *  Omit it to get all org images (All Images tab).
   */
  async searchLogos(
    channel: string,
    createdBy?: string
  ): Promise<ApiResponse<{ count: number; content: unknown[] }>> {
    const filters: Record<string, unknown> = {
      mediaType: ['image'],
      contentType: ['Asset'],
      compatibilityLevel: { min: 1, max: 2 },
      status: ['Live'],
      primaryCategory: 'Asset',
      channel,
    };
    if (createdBy) filters.createdBy = createdBy;

    return getClient().post<{ count: number; content: unknown[] }>(
      '/content/v1/search',
      {
        request: {
          filters,
          sort_by: { lastUpdatedOn: 'desc' },
          limit: 50,
          offset: 0,
        },
      }
    );
  }

  /** Fetch the full details of a single cert template (includes signatoryList.image) */
  async readCertTemplate(
    identifier: string
  ): Promise<ApiResponse<{ content: unknown }>> {
    return getClient().get<{ content: unknown }>(
      `/content/v1/read/${identifier}?fields=signatoryList,issuer,artifactUrl,name,identifier`
    );
  }

  /** Search existing certificate templates in the org */
  async searchCertTemplates(
    channel: string
  ): Promise<ApiResponse<{ count: number; content: CertTemplateSummary[] }>> {
    return getClient().post<{ count: number; content: CertTemplateSummary[] }>(
      '/content/v1/search',
      {
        request: {
          filters: {
            certType: 'cert template',
            channel,
            mediaType: 'image',
          },
          sort_by: { lastUpdatedOn: 'desc' },
          fields: [
            'identifier',
            'name',
            'code',
            'certType',
            'data',
            'issuer',
            'signatoryList',
            'artifactUrl',
            'primaryCategory',
            'channel',
          ],
          limit: 100,
        },
      }
    );
  }
  /**
   * Re-issue a certificate for one or more users.
   * POST /certreg/v1/cert/reissue
   */
  async reissueCertificate(params: {
    courseId: string;
    batchId: string;
    userIds: string[];
    createdBy: string;
  }): Promise<ApiResponse<unknown>> {
    return getClient().post<unknown>(
      '/course/batch/cert/v1/issue?reIssue=true',
      {
        request: {
          courseId: params.courseId,
          batchId: params.batchId,
          userIds: params.userIds,
          createdBy: params.createdBy,
        },
      }
    );
  }
  async searchCertificates(userId: string): Promise<ApiResponse<CertificateSearchResponse>> {
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
