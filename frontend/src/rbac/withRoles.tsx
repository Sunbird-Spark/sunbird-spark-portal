import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';

interface WithRolesOptions {
  unauthorizedTo?: string;       // <-- clearer naming than redirectTo
  unauthenticatedTo?: string;
}

/**
 * Higher Order Component that protects routes based on user roles
 */
export const withRoles = <P extends object>(
  allowedRoles: Role[],
  options?: WithRolesOptions
) => {
  return (Component: React.ComponentType<P>): React.FC<P> => {
    const WrappedComponent: React.FC<P> = (props) => {
      const { user, isAuthenticated } = useAuth();
      const location = useLocation();

      // 1) Redirect unauthenticated users to home
      if (!isAuthenticated) {
        const loginPath = options?.unauthenticatedTo || '/home';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
      }

      // 2) Redirect authenticated but unauthorized users to unauthorized page
      const hasPermission = user && allowedRoles.includes(user.role);

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
