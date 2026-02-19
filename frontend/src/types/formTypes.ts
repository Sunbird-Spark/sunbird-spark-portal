import { ContentSearchRequest } from './workspaceTypes';

export interface FormReadRequest {
  type: string;
  subType?: string;
  action: string;
  component?: string;
  rootOrgId?: string;
  framework?: string;
}

// Keep original interface for compatibility
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

// Renamed interface for the full API response structure
export interface FormConfigResponse {
  id: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
  };
  responseCode: string;
  result: {
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
