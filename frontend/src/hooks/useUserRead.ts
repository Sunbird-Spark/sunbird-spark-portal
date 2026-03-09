import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import { UserReadResponse } from '../types/userTypes';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const userService = new UserService();

// Cache user data for 1 hour by default so navigating between pages
// (workspace, explore, etc.) does not trigger a redundant API call every time.
const DEFAULT_STALE_TIME = 60 * 60 * 1000;

export const useUserRead = (
    options?: { refetchOnMount?: boolean | 'always' }
): UseQueryResult<ApiResponse<UserReadResponse>, Error> => {
    const isAuthenticated = userAuthInfoService.isUserAuthenticated();

    return useQuery({
        queryKey: ['userRead'],
        queryFn: async () => {
            const id = userAuthInfoService.getUserId() ??
                (await userAuthInfoService.getAuthInfo())?.uid;

            if (!id) {
                throw new Error('User ID not available');
            }

            return userService.userRead(id);
        },
        enabled: isAuthenticated,
        retry: 1,
        staleTime: DEFAULT_STALE_TIME,
        refetchOnMount: options?.refetchOnMount,
    });
};
