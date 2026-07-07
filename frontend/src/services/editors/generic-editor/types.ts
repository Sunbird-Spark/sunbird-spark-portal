/**
 * Types for the generic editor integration (native @project-sunbird/generic-editor-v2).
 * The legacy iframe window-config / lock / mime-type types were removed with the blob editor.
 */

export interface GenericEditorContext {
  user: {
    id: string;
    name: string;
    orgIds: string[];
    organisations: Record<string, string>;
  };
  did: string;
  sid: string;
  contentId: string;
  pdata: {
    id: string;
    ver: string;
    pid: string;
  };
  contextRollUp: Record<string, string>;
  tags: string[];
  channel: string;
  defaultLicense: string;
  env: string;
  framework: string;
  ownershipType: string[];
  timeDiff: number;
  instance: string;
  primaryCategories: string[];
  uploadInfo?: {
    isLargeFileUpload: boolean;
  };
}

export interface GenericEditorRouteParams {
  contentId?: string;
  state?: string;
  framework?: string;
  contentStatus?: string;
}

export interface ContentDetails {
  identifier: string;
  name?: string;
  status?: string;
  mimeType?: string;
  createdBy?: string;
  collaborators?: string[];
  contentDisposition?: string;
  framework?: string;
  primaryCategory?: string;
  versionKey?: string;
}
