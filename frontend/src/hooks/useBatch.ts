import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { batchService, Batch } from '../services/BatchService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export const useBatchList = (courseId: string | undefined): UseQueryResult<Batch[], Error> => {
  return useQuery({
    queryKey: ['batchList', courseId],
    queryFn: async (): Promise<Batch[]> => {
      if (!courseId) return [];

      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid;
      }

      if (!userId) return [];

      const response = await batchService.listBatches(courseId, userId);
      return response?.data?.response?.content ?? [];
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};
