import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UserService, UserReadResponse } from '../services/UserService';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const userService = new UserService();

export const useUserRead = (): UseQueryResult<ApiResponse<UserReadResponse>, Error> => {
    const id = userAuthInfoService.getUserId();

    return useQuery({
        queryKey: ['userRead', id],
        queryFn: () => {
            if (!id) {
                throw new Error('User ID not available');
            }
            return userService.userRead(id);
        },
        enabled: !!id,
    });
};
