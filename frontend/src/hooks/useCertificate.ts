import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { certificateService, CertificateSearchResponse } from '../services/CertificateService';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export const useUserCertificates = (): UseQueryResult<ApiResponse<CertificateSearchResponse>, Error> => {
  return useQuery({
    queryKey: ['userCertificates'],
    queryFn: async () => {
      let userId = userAuthInfoService.getUserId();

      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo.uid;
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      return certificateService.searchCertificates(userId);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
