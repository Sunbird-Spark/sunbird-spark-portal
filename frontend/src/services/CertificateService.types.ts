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
  oldTemplateId?: string;
}

export interface RemoveTemplateRequest {
  batch: {
    courseId: string;
    batchId: string;
    template: {
      identifier: string;
    };
  };
}
