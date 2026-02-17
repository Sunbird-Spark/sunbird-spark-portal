export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'document';
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

export interface RelatedItem {
  id: string;
  title: string;
  type: string;
  image: string;
  isResource?: boolean;
  rating?: number;
  learners?: string;
  lessons?: number;
}

export interface CollectionData {
  id: string;
  title: string;
  lessons: number;
  image: string;
  units: number;
  description: string;
  audience: string[];
  modules: Module[];
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
}

export interface CourseHierarchyResponse {
  content: HierarchyContentNode;
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
