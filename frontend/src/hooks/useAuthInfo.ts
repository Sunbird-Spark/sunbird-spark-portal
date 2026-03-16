import { useQuery, UseQueryResult } from '@tanstack/react-query';
import userAuthInfoService, { type AuthStatusResponse } from '../services/userAuthInfoService/userAuthInfoService';

/**
 * Hook to fetch and cache authentication information from /user/v1/auth/info
 * This includes session ID (sid), user ID (uid), and authentication status.
 * 
 * This prevents unnecessary API calls while ensuring auth state stays current.
 */
export const useAuthInfo = (): UseQueryResult<AuthStatusResponse, Error> => {
  return useQuery({
    queryKey: ['authInfo'],
    queryFn: async () => {
      const authInfo = await userAuthInfoService.getAuthInfo();
      return authInfo;
    },
    staleTime: Infinity, // Data remains fresh until page reload
    gcTime: 3600000, 
    retry: 1,
  });
};

/**
 * Hook to get the current session ID (sid).
 * Returns the cached value from React Query if available.
 */
export const useSessionId = (): string | null => {
  const { data } = useAuthInfo();
  return data?.sid ?? null;
};

/**
 * Hook to get the current user ID (uid).
 * Returns the cached value from React Query if available.
 */
export const useUserId = (): string | null => {
  const { data } = useAuthInfo();
  return data?.uid ?? null;
};

/**
 * Hook to check if the user is authenticated.
 * Returns both the authentication flag and the loading state.
 * Consumers should avoid making access-control decisions until `isLoading` is false.
 */
export const useIsAuthenticated = (): { isAuthenticated: boolean; isLoading: boolean } => {
  const { data, isLoading } = useAuthInfo();
  return {
    isAuthenticated: data?.isAuthenticated ?? false,
    isLoading,
  };
};
