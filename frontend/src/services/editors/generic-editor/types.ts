/**
 * Types for the Generic Editor integration.
 * Based on the SunbirdEd-portal generic editor pattern (iframe-based modal editor).
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

export interface EditorPlugin {
  id: string;
  ver: string | number;
  type: string;
}

export interface GenericEditorWindowConfig {
  corePluginsPackaged: boolean;
  modalId: string;
  dispatcher: string;
  apislug: string;
  alertOnUnload: boolean;
  localDispatcherEndpoint?: string;
  headerLogo: string;
  loadingImage: string;
  build_number: string;
  lock: {
    lockKey?: string;
    expiresAt?: string;
    expiresIn?: string;
  };
  extContWhitelistedDomains: string;
  enableTelemetryValidation: boolean;
  videoMaxSize: string;
  defaultContentFileSize: number;
  cloudStorage: {
    provider: string;
  };
  plugins: EditorPlugin[];
  previewConfig: {
    repos: string[];
    plugins: EditorPlugin[];
    splash: {
      text: string;
      icon: string;
      bgImage: string;
      webLink: string;
    };
    overlay: {
      showUser: boolean;
    };
    showEndPage: boolean;
  };
  contentFields?: string;
  fwCategoryDetails?: { code: string; label: string }[];
}

export interface GenericEditorRouteParams {
  contentId?: string;
  state?: string;
  framework?: string;
  contentStatus?: string;
}

export interface GenericEditorQueryParams {
  lockKey?: string;
  expiresAt?: string;
  expiresIn?: string;
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

export interface LockContentResponse {
  lockKey: string;
  expiresAt: string;
  expiresIn: string;
}

/** MIME types supported by the generic editor */
export const GENERIC_EDITOR_MIME_TYPES = [
  'application/pdf',
  'video/mp4',
  'video/x-youtube',
  'video/youtube',
  'application/vnd.ekstep.html-archive',
  'application/epub',
  'application/vnd.ekstep.h5p-archive',
  'video/webm',
  'text/x-url',
] as const;

export type GenericEditorMimeType = (typeof GENERIC_EDITOR_MIME_TYPES)[number];
