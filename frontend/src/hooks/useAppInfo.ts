import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getClient, ApiResponse } from '../lib/http-client';

interface AppInfo {
  appId: string;
  version: string;
  buildHash: string;
}

export const useAppInfo = (): UseQueryResult<ApiResponse<AppInfo>, Error> => {
  return useQuery({
    queryKey: ['app-info'],
    queryFn: () => getClient().get<AppInfo>('/app/v1/info'),
    staleTime: Infinity, // Data remains fresh until page reload
    gcTime: 3600000, // Keep in cache indefinitely
  });
};
