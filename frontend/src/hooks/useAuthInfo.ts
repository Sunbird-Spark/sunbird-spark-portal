import { useQuery, UseQueryResult } from '@tanstack/react-query';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

interface AuthStatusResponse {
  sid: string;
  uid: string | null;
  isAuthenticated: boolean;
}

/**
 * Hook to fetch and cache authentication information from /user/v1/auth/info
 * This includes session ID (sid), user ID (uid), and authentication status.
 * 
 * The data is cached indefinitely by React Query until page reload.
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
    gcTime: 3600000, // Keep in cache for 1 hour
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
 * Returns false while loading or if not authenticated.
 */
export const useIsAuthenticated = (): boolean => {
  const { data } = useAuthInfo();
  return data?.isAuthenticated ?? false;
};
