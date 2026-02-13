
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
