import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { SystemSettingService } from '../services/SystemSettingService';
import { ApiResponse } from '../lib/http-client';

const systemSettingService = new SystemSettingService();

export const useSystemSetting = (id: string): UseQueryResult<ApiResponse<any>, Error> => {
  return useQuery({
    queryKey: ['system-setting', id],
    queryFn: () => systemSettingService.read(id),
    enabled: !!id,
    staleTime: Infinity, // Data remains fresh until page reload
    gcTime: 3600000, // Keep in cache indefinitely
  });
};
