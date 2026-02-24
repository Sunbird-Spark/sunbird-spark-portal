import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

const userService = new UserService();

interface WithRolesOptions {
  unauthorizedTo?: string;
  unauthenticatedTo?: string;
}

/**
 * Fetches the backend roles for the current user and checks if any of
 * the allowedRoles are present. Returns `null` while still loading.
 */
function useBackendRoleCheck(allowedRoles: Role[]): boolean | null {
  const SUNBIRD_ROLE_MAP: Partial<Record<Role, string>> = {
    admin: 'ORG_ADMIN',
    content_creator: 'CONTENT_CREATOR',
    content_reviewer: 'CONTENT_REVIEWER',
  };

  const { data: roles, isLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) return null; // still loading — don't decide yet

  const backendRoles = new Set((roles ?? []).map((r) => r.role));
  return allowedRoles.some((role) => {
    const sunbirdRole = SUNBIRD_ROLE_MAP[role];
    return sunbirdRole ? backendRoles.has(sunbirdRole) : false;
  });
}

/**
 * Higher Order Component that protects routes based on user roles.
 * Uses backend role data rather than the AuthContext stub, so real
 * Sunbird logins work correctly. Renders nothing while roles are loading
 * to avoid a flash of the /unauthorized page.
 */
export const withRoles = <P extends object>(
  allowedRoles: Role[],
  options?: WithRolesOptions
) => {
  return (Component: React.ComponentType<P>): React.FC<P> => {
    const WrappedComponent: React.FC<P> = (props) => {
      const { isAuthenticated: contextAuth } = useAuth();
      const location = useLocation();
      const isAuthenticated = contextAuth || userAuthInfoService.isUserAuthenticated();
      const hasPermission = useBackendRoleCheck(allowedRoles);

      // 1) Redirect unauthenticated users to home
      if (!isAuthenticated) {
        const loginPath = options?.unauthenticatedTo || '/home';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
      }

      // 2) While roles are still loading, render nothing (avoids flash to /unauthorized)
      if (hasPermission === null) {
        return null;
      }

      // 3) Redirect authenticated but unauthorized users to unauthorized page
      if (!hasPermission) {
        const unauthorizedPath = options?.unauthorizedTo || '/unauthorized';
        return <Navigate to={unauthorizedPath} replace />;
      }

      return <Component {...props} />;
    };

    WrappedComponent.displayName = `withRoles(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
  };
};
