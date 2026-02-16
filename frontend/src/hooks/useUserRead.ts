import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import { UserReadResponse } from '../types/userTypes';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const userService = new UserService();

export const useUserRead = (): UseQueryResult<ApiResponse<UserReadResponse>, Error> => {
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
        retry: 1,
    });
};
