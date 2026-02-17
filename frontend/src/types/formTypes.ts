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
      data: any;
      created_on: string;
      last_modified_on: string | null;
      rootOrgId: string;
    };
  };
}

export interface UseFormReadOptions {
  request: FormReadRequest;
  enabled?: boolean;
}
