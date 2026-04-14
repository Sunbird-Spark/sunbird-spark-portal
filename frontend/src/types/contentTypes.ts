export interface ContentVariant {
  ecarUrl: string;
  size: string;
}

export interface ContentVariants {
  full?: ContentVariant;
  spine?: ContentVariant;
}

export interface ContentData {
  ownershipType: string[];
  previewUrl?: string;
  channel: string;
  downloadUrl?: string;
  language: string[];
  mimeType: string;
  variants?: ContentVariants;
  objectType: string;
  primaryCategory: string;
  artifactUrl?: string;
  contentEncoding?: string;
  contentType: string;
  identifier: string;
  description?: string;
  audience: string[];
  visibility: string;
  discussionForum?: {
    enabled: string;
  };
  mediaType: string;
  osId?: string;
  languageCode: string[];
  lastPublishedBy?: string;
  version: number;
  license: string;
  prevState?: string;
  size: number;
  lastPublishedOn?: string;
  name: string;
  status: string;
  code: string;
  interceptionPoints?: any;
  credentials?: {
    enabled: string;
  };
  prevStatus?: string;
  idealScreenSize?: string;
  createdOn: string;
  contentDisposition?: string;
  lastUpdatedOn: string;
  dialcodeRequired?: string;
  lastStatusChangedOn: string;
  createdFor: string[];
  creator: string;
  os: string[];
  cloudStorageKey?: string;
  se_FWIds?: string[];
  pkgVersion: number;
  versionKey: string;
  idealScreenDensity?: string;
  framework: string;
  s3Key?: string;
  createdBy: string;
  compatibilityLevel: number;
  relatedContent?: ContentData[];
}

export interface ContentApiParams {
  resmsgid: string;
  msgid: string;
  status: string;
  err: null | string;
  errmsg: null | string;
}

export interface ContentApiResponse {
  id?: string;
  ver?: string;
  ts?: string;
  params?: ContentApiParams;
  responseCode?: string;
  content: ContentData;
}