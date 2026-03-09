import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import { UserReadResponse } from '../types/userTypes';
import { ApiResponse } from '../lib/http-client';
import { useAuthInfo } from './useAuthInfo';

const userService = new UserService();

// Cache user data for 10 minutes by default so navigating between pages
// (workspace, explore, etc.) does not trigger a redundant API call every time.
const DEFAULT_STALE_TIME = 10 * 60 * 1000;

export const useUserRead = (
    options?: { refetchOnMount?: boolean | 'always' }
): UseQueryResult<ApiResponse<UserReadResponse>, Error> => {
    const { data: authInfo } = useAuthInfo();
    const isAuthenticated = authInfo?.isAuthenticated ?? false;
    const userId = authInfo?.uid ?? null;

    return useQuery({
        queryKey: ['userRead'],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID not available');
            }

            return userService.userRead(userId);
        },
        enabled: isAuthenticated && !!userId,
        retry: 1,
        staleTime: DEFAULT_STALE_TIME,
        refetchOnMount: options?.refetchOnMount,
    });
};
