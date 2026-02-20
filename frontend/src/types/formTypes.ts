import { ContentSearchRequest } from './workspaceTypes';

export interface FormReadRequest {
  type: string;
  subType?: string;
  action: string;
  component?: string;
  rootOrgId?: string;
  framework?: string;
}
export interface FormReadResponse {
  form: {
    framework: string;
    type: string;
    subtype: string;
    action: string;
    component: string;
    data: any;
    created_on: string;
    last_modified_on: string;
    rootOrgId: string;
  };
}

export interface FormSection {
  id: string;
  index: number;
  title: string;
  type: 'content' | 'categories' | 'resources';
  criteria?: {
    request: ContentSearchRequest;
  };
  list?: CategoryItem[];
}

export interface CategoryItem {
  id: string;
  index: number;
  title: string;
  code: string;
  value: string;
}

export interface UseFormReadOptions {
  request: FormReadRequest;
  enabled?: boolean;
}

export interface ExploreFilterOption {
  id: string;
  index: number;
  label: string;
  code: string;
  value: string | string[];
}

export interface ExploreFilterGroup {
  id: string;
  index: number;
  label: string;
  options?: ExploreFilterOption[];
  list?: ExploreFilterOption[];
}
