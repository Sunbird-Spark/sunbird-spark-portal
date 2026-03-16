import { useMutation, useQuery, UseMutationResult } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../lib/http-client';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const userService = new UserService();

export const useLearnerFuzzySearch = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { identifier: string; name: string; captchaResponse?: string }
> => {
  return useMutation({
    mutationFn: (variables: { identifier: string; name: string; captchaResponse?: string }) =>
      userService.searchUser(variables.identifier, variables.name, variables.captchaResponse),
  });
};

export const useResetPassword = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any }
> => {
  return useMutation({
    mutationFn: (variables: { request: any }) =>
      userService.resetPassword(variables.request),
  });
};

export const useSignup = (): UseMutationResult<
  ApiResponse<{ userId: string; }>,
  Error,
  { firstName: string; identifier: string; password: string; deviceId?: string }
> => {
  return useMutation({
    mutationFn: (variables: { firstName: string; identifier: string; password: string; deviceId?: string }) =>
      userService.signup(variables.firstName, variables.identifier, variables.password, variables.deviceId),
  });
};

/**
 * Hook to fetch the currently logged-in user's roles from the backend.
 */
export const useUserRoles = () => {
  return useQuery({
    queryKey: ['userRoles'],
    queryFn: async (): Promise<Array<{ role: string }>> => {
      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid ?? null;
      }
      if (!userId) return [];
      const response = await userService.getUserRoles(userId);
      return response?.data?.response?.roles ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — roles rarely change mid-session
    retry: 1,
  });
};

/**
 * Returns the currently logged-in user's uid, backed by React Query so it
 * is cached and reactive. Tries the synchronous cache first; falls back to
 * fetching /user/v1/auth/info when the cache is empty.
 */
export const useCurrentUserId = () => {
  return useQuery({
    queryKey: ['currentUserId'],
    queryFn: async (): Promise<string | null> => {
      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid ?? null;
      }
      return userId;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Returns true when the currently logged-in user has the CONTENT_CREATOR
 * role in their Sunbird profile (fetched from /user/v5/read).
 * Returns false while the request is in-flight or if the user has no
 * such role.
 */
export const useIsContentCreator = (): boolean => {
  const { data: roles } = useUserRoles();
  return (roles ?? []).some((r) => r.role === 'CONTENT_CREATOR');
};

/**
 * Returns true when the currently logged-in user has the ORG_ADMIN
 * role in their Sunbird profile (fetched from /user/v5/read).
 * Returns false while the request is in-flight or if the user has no such role.
 */
export const useIsAdmin = (): boolean => {
  const { data: roles } = useUserRoles();
  return (roles ?? []).some((r) => r.role === 'ORG_ADMIN');
};

/**
 * Returns true when the currently logged-in user has the COURSE_MENTOR
 * role in their Sunbird profile (fetched from /user/v5/read).
 * Returns false while the request is in-flight or if the user has no
 * such role.
 */
export const useIsMentor = (): boolean => {
  const { data: roles } = useUserRoles();
  return (roles ?? []).some((r) => r.role === 'COURSE_MENTOR');
};

