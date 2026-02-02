import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { OrganizationService } from '../services/OrganizationService';
import { ApiResponse } from '../lib/http-client';

const organizationService = new OrganizationService();

export const useOrganizationSearch = (): UseMutationResult<ApiResponse<any>, Error, any> => {
  return useMutation({
    mutationFn: (request: any) => organizationService.search(request),
  });
};
