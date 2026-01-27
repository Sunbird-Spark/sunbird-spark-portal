import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosAdapter } from '../api/adapters/AxiosAdapter';
import { ContentService } from '../services/ContentService';
import { ApiResponse } from '../api/types';

// Example configuration - in a real app this might come from env vars or a config provider
const client = new AxiosAdapter({
  baseURL: 'https://jsonplaceholder.typicode.com',
  statusHandlers: {
    401: () => console.log('Unauthorized - Redirecting to login...'),
    403: () => console.log('Forbidden - Access denied...'),
  },
});

const contentService = new ContentService(client);

export const useContent = (): UseQueryResult<ApiResponse<any>, Error> => {
  return useQuery({
    queryKey: ['content'],
    queryFn: () => contentService.getContent(),
  });
};
