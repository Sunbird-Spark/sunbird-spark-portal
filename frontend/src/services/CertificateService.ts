import { getClient, ApiResponse } from '../lib/http-client';

// ─── Dashboard cert-search / re-issue types ───────────────────────────────────
export interface IssuedCertificate {
  identifier: string;
  name: string;
  lastIssuedOn: string;
  templateUrl: string;
  token?: string;
  type?: string;
}

export interface CertUserBatch {
  batchId: string;
  name: string;
  courseId: string;
  completionPercentage: number;
  status: number;
  issuedCertificates: IssuedCertificate[];
  batch?: { batchId: string; name: string; createdBy: string };
  completedOn?: number;
  enrolledDate?: number;
}

export interface CertUserSearchResponse {
  response: {
    userId: string;
    userName: string;
    courses: {
      courseId: string;
      name: string;
      contentType: string;
      batches: CertUserBatch[];
    };
  };
}

export interface CertSignatory {
  name: string;
  designation: string;
  id: string;
  /** base64 or URL — always required by the API */
  image: string;
}

export interface CertTemplateSummary {
  identifier: string;
  name: string;
  previewUrl?: string;
  artifactUrl?: string;
  downloadUrl?: string;
  issuer?: { name: string; url: string };
  signatoryList?: CertSignatory[];
}

export interface CreateAssetRequest {
  name: string;
  code: string;
  mimeType: 'image/svg+xml';
  license: string;
  primaryCategory: 'Certificate Template';
  mediaType: 'image';
  certType: 'cert template';
  channel: string;
  issuer: { name: string; url: string };
  signatoryList: Array<{
    name: string;
    designation: string;
    id: string;
    /** Always required — pass base64 dataURL or CDN URL; never omit */
    image: string;
  }>;
}

export interface AssetCreateResponse {
  identifier: string;
  node_id: number;
  versionKey: string;
}

export interface AddTemplateRequest {
  batch: {
    courseId: string;
    batchId: string;
    template: {
      identifier: string;
      criteria: {
        enrollment?: { status: number };
        user?: { rootOrgId: string };
      };
      name: string;
      issuer: { name: string; url: string };
      previewUrl: string;
      signatoryList: Array<{
        name: string;
        designation: string;
        id: string;
        /** Always required by the API — pass empty string if no image */
        image: string;
      }>;
    };
  };
}

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
    } catch (error: any) {
      throw new Error(error.message || 'Upload failed');
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

  /** Search for image assets (logos/signatures already uploaded) in the org.
   *  Pass `createdBy` to filter to the current user's own uploads (My Images tab).
   *  Omit it to get all org images (All Images tab).
   */
  async searchLogos(
    channel: string,
    createdBy?: string
  ): Promise<ApiResponse<{ count: number; content: any[] }>> {
    const filters: Record<string, unknown> = {
      mediaType: ['image'],
      contentType: ['Asset'],
      compatibilityLevel: { min: 1, max: 2 },
      status: ['Live'],
      primaryCategory: 'Asset',
      channel,
    };
    if (createdBy) filters.createdBy = createdBy;

    return getClient().post<{ count: number; content: any[] }>(
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
  ): Promise<ApiResponse<{ content: any }>> {
    return getClient().get<{ content: any }>(
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

  // ─── Dashboard: search a user's certificate status ───────────────────────────
  /**
   * Search for a user by Unique ID (userName) within a course.
   * POST /certreg/v1/user/search
   */
  async searchCertUser(params: {
    userName: string;
    courseId: string;
    createdBy: string;
  }): Promise<ApiResponse<CertUserSearchResponse>> {
    return getClient().post<CertUserSearchResponse>(
      '/certreg/v1/user/search',
      {
        request: {
          filters: {
            userName: params.userName,
            courseId: params.courseId,
            createdBy: params.createdBy,
          },
        },
      }
    );
  }

  // ─── Dashboard: re-issue a certificate ───────────────────────────────────────
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
      '/certreg/v1/cert/reissue',
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
}

export const certificateService = new CertificateService();
