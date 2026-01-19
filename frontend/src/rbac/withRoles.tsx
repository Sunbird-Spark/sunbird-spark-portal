import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';

interface WithRolesOptions {
  redirectTo?: string;
  unauthenticatedTo?: string;
}

/**
 * Higher Order Component that protects routes based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the component
 * @param options - Optional configuration for redirects
 * @returns A wrapped component that enforces role-based access control
 */
export const withRoles = <P extends object>(
  allowedRoles: Role[],
  options?: WithRolesOptions
) => {
  return (Component: React.ComponentType<P>): React.FC<P> => {
    const WrappedComponent: React.FC<P> = (props) => {
      const { user, isAuthenticated } = useAuth();
      const location = useLocation();

      // Redirect unauthenticated users to login
      if (!isAuthenticated) {
        const loginPath = options?.unauthenticatedTo || '/login';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
      }

      // Check if user's role is in the allowed roles
      const hasPermission = user && allowedRoles.includes(user.role);

      if (!hasPermission) {
        const unauthorizedPath = options?.redirectTo || '/login';
        return <Navigate to={unauthorizedPath} replace />;
      }

      // User is authenticated and has the required role
      return <Component {...props} />;
    };

    // Set display name for debugging
    WrappedComponent.displayName = `withRoles(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
  };
};
