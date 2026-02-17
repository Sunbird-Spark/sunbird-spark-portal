export interface FormReadRequest {
  type: string;
  subType?: string;
  action: string;
  component?: string;
  rootOrgId?: string;
  framework?: string;
}

export interface FormReadResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err: string | null;
    errmsg: string | null;
  };
  responseCode: string;
  result: {
    form: {
      type: string;
      subtype: string;
      action: string;
      component: string;
      framework: string;
      data: {
        sections: FormSection[];
      };
      created_on: string;
      last_modified_on: string | null;
      rootOrgId: string;
    };
  };
}

export interface FormSection {
  id: string;
  index: number;
  title: string;
  type: 'content' | 'categories' | 'resource';
  criteria?: {
    request: import('./workspaceTypes').ContentSearchRequest;
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
