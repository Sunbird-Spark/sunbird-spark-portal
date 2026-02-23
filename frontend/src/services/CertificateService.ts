import { getClient, ApiResponse } from '../lib/http-client';

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

    const response = await fetch(`/portal/asset/v1/upload/${assetId}`, {
      method: 'POST',
      body: formData,
      headers: sanitizedHeaders,
    });

    if (!response.ok) {
      const text = await response.text();
      let errmsg = `Upload failed (${response.status})`;
      try {
        const json = JSON.parse(text);
        errmsg = json?.params?.errmsg ?? errmsg;
      } catch (e) {
        console.error("Failed to parse JSON error response:", e);
        errmsg = `${errmsg}. Raw response: ${text}`;
      }
      throw new Error(errmsg);
    }

    const json = await response.json();
    const result = json?.result ?? json;
    return {
      data: result,
      status: response.status,
      headers: {} as Record<string, unknown>,
    };
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
}

export const certificateService = new CertificateService();
