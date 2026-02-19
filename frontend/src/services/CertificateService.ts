import { getClient, ApiResponse } from '../lib/http-client';

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
    image?: string;
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
        image?: string;
      }>;
    };
  };
}

export class CertificateService {
  /** Step 1: Create the certificate asset record */
  async createAsset(
    assetData: CreateAssetRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<AssetCreateResponse>> {
    return getClient().post<AssetCreateResponse>(
      '/content/asset/v1/create',
      { request: { asset: assetData } },
      headers
    );
  }

  /** Step 2: Upload the SVG file to the created asset */
  async uploadAsset(
    assetId: string,
    svgBlob: Blob,
    fileName: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<{ artifactUrl: string; content_url: string }>> {
    const formData = new FormData();
    formData.append('file', svgBlob, fileName);

    // We need to send multipart — use fetch directly since our http-client doesn't support FormData
    const response = await fetch(`/portal/content/asset/v1/upload/${assetId}`, {
      method: 'POST',
      body: formData,
      headers: headers ?? {},
    });

    if (!response.ok) {
      const text = await response.text();
      let errmsg = `Upload failed (${response.status})`;
      try {
        const json = JSON.parse(text);
        errmsg = json?.params?.errmsg ?? errmsg;
      } catch { /* ignore */ }
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

  /** Step 3: Attach the certificate template to the batch */
  async addTemplateToBatch(
    request: AddTemplateRequest,
    headers?: Record<string, string>
  ): Promise<ApiResponse<unknown>> {
    return getClient().patch<unknown>(
      '/certreg/v1/template/add',
      { request },
      headers
    );
  }

  /** Search for image assets (logos) in the org */
  async searchLogos(
    channel: string,
    offset = 0
  ): Promise<ApiResponse<{ count: number; content: any[] }>> {
    return getClient().post<{ count: number; content: any[] }>(
      '/api/content/v1/search',
      {
        request: {
          filters: {
            mediaType: ['image'],
            contentType: ['Asset'],
            compatibilityLevel: { min: 1, max: 2 },
            status: ['Live'],
            primaryCategory: 'Asset',
            channel,
          },
          sort_by: { lastUpdatedOn: 'desc' },
          limit: 50,
          offset,
        },
      }
    );
  }
}

export const certificateService = new CertificateService();
