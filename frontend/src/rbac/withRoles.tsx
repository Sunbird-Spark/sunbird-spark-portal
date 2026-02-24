import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import { UserService } from '../services/UserService';
import PageLoader from '../components/common/PageLoader';

interface WithRolesOptions {
  unauthorizedTo?: string;       // <-- clearer naming than redirectTo
  unauthenticatedTo?: string;
}

const userService = new UserService();

/**
 * Higher Order Component that protects routes based on user roles
 */
export const withRoles = <P extends object>(
  allowedRoles: Role[],
  options?: WithRolesOptions
) => {
  return (Component: React.ComponentType<P>): React.FC<P> => {
    const WrappedComponent: React.FC<P> = (props) => {
      const { user, isAuthenticated: contextAuth } = useAuth();
      const location = useLocation();
      const isBackendAuth = userAuthInfoService.isUserAuthenticated();
      
      const isAuthenticated = contextAuth || isBackendAuth;

      // Map frontend roles to backend roles
      const allowedBackendRoles = useMemo(() => allowedRoles.map(r => r.toUpperCase()), [allowedRoles]);

      const [backendRoles, setBackendRoles] = useState<Array<{ role: string }>>([]);
      const [rolesLoading, setRolesLoading] = useState<boolean>(true);

      useEffect(() => {
        if (!isBackendAuth || contextAuth) {
           setRolesLoading(false);
           return;
        }

        let isMounted = true;
        
        const fetchRoles = async () => {
          try {
            let userId = userAuthInfoService.getUserId();
            if (!userId) {
              const authInfo = await userAuthInfoService.getAuthInfo();
              userId = authInfo?.uid ?? null;
            }
            if (userId) {
              const response = await userService.getUserRoles(userId);
              if (isMounted) {
                setBackendRoles(response?.data?.response?.roles ?? []);
              }
            }
          } catch (e) {
            console.error('Failed to fetch backend roles in withRoles', e);
          } finally {
            if (isMounted) setRolesLoading(false);
          }
        };

        fetchRoles();

        return () => { isMounted = false; };
      }, [isBackendAuth, contextAuth]);

      // 1) Redirect unauthenticated users to home
      if (!isAuthenticated) {
        const loginPath = options?.unauthenticatedTo || '/home';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
      }

      // 2) Check frontend mock user
      if (contextAuth && user) {
        const hasPermission = allowedRoles.includes(user.role);
        if (!hasPermission) {
          const unauthorizedPath = options?.unauthorizedTo || '/unauthorized';
          return <Navigate to={unauthorizedPath} replace />;
        }
        return <Component {...props} />;
      }

      // 3) Check backend user
      if (isBackendAuth && !contextAuth) {
        if (rolesLoading) {
          return <PageLoader message="Verifying permissions..." fullPage />;
        }

        const hasBackendPermission = (backendRoles ?? []).some(r => 
          allowedBackendRoles.includes(r.role)
        );

        if (!hasBackendPermission) {
          const unauthorizedPath = options?.unauthorizedTo || '/unauthorized';
          return <Navigate to={unauthorizedPath} replace />;
        }

        return <Component {...props} />;
      }

      return null;
    };

    WrappedComponent.displayName = `withRoles(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
  };
};
