import { getClient, ApiResponse } from '../lib/http-client';
import { FormReadRequest, FormReadResponse } from '../types/formTypes';

export class FormService {
  public async formRead(
    request: FormReadRequest
  ): Promise<ApiResponse<FormReadResponse>> {
    return getClient().post<FormReadResponse>('/data/v1/form/read', {
      request: {
        type: request.type,
        subType: request.subType ?? '',
        action: request.action,
        component: request.component ?? '*',
        rootOrgId: request.rootOrgId ?? '*',
        framework: request.framework ?? '*'
      },
    });
  }
}
