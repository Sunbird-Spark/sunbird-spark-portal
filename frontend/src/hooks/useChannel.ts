import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ChannelService } from '../services/ChannelService';
import { ApiResponse } from '../lib/http-client';

const channelService = new ChannelService();

export const useChannel = (id: string): UseQueryResult<ApiResponse<any>, Error> => {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: () => channelService.read(id),
    enabled: !!id,
  });
};
