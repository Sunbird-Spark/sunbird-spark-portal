import { getClient, ApiResponse } from '../lib/http-client';
import { FormReadRequest, FormReadResponse } from '../types/formTypes';

export class FormService {
  public async formRead<T = FormReadResponse>(
    request: FormReadRequest
  ): Promise<ApiResponse<T>> {
    return getClient().post<T>('/data/v1/form/read', {
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
