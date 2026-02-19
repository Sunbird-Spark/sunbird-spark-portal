export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document';
  mimeType?: string;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

export type TrackableEnabled = "Yes" | "No";
export interface CollectionData {
  id: string;
  title: string;
  lessons: number;
  image: string;
  units: number;
  description: string;
  audience: string[];
  modules: Module[];
  trackable?: { enabled?: TrackableEnabled };
}

export interface HierarchyContentNode {
  identifier: string;
  name?: string;
  description?: string;
  appIcon?: string;
  primaryCategory?: string;
  mimeType?: string;
  leafNodesCount?: number;
  audience?: string[];
  children?: HierarchyContentNode[];
  trackable?: { enabled?: TrackableEnabled };
}

export interface CourseHierarchyResponse {
  content: HierarchyContentNode;
}

export interface BatchListItem {
  identifier: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
  enrollmentType?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export interface BatchListResponse {
  response?: {
    content?: BatchListItem[];
    count?: number;
  };
}

export interface CertTemplate {
  identifier: string;
  previewUrl?: string;
  url?: string;
  name?: string;
  description?: string;
  criteria?: unknown;
  issuer?: unknown;
  signatoryList?: unknown[];
}

export interface BatchReadResponse {
  response?: {
    identifier?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    cert_templates?: Record<string, CertTemplate>;
    [key: string]: unknown;
  };
}

export interface ContentStateItem {
  contentId: string;
  status?: number;
  lastAccessTime?: number;
  [key: string]: unknown;
}

export interface ContentStateReadResponse {
  contentList?: ContentStateItem[];
}

export interface ContentStateReadRequest {
  userId: string;
  courseId: string;
  batchId: string;
  contentIds: string[];
}

import type { ContentSearchItem } from './workspaceTypes';

export type RelatedContentItem = ContentSearchItem & { cardType?: 'collection' | 'resource' };

export interface RelatedContentSearchItem {
  identifier: string;
  name?: string;
  posterImage?: string;
  thumbnail?: string;
  visibility?: string;
  parent?: string;
  primaryCategory?: string;
  mimeType?: string;
  appIcon?: string;
  leafNodesCount?: number;
  resourceType?: string;
}
