import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '../auth/AuthContext';
import { usePermissions } from '../hooks/usePermission';
import PageLoader from '../components/common/PageLoader';

interface WithRolesOptions {
  unauthorizedTo?: string;
  unauthenticatedTo?: string;
  requireAll?: boolean;
}

/**
 * Higher Order Component that protects routes based on user roles
 * Now uses the new permission system with usePermissions hook
 */
export const withRoles = <P extends object>(
  allowedRoles: Role[],
  options?: WithRolesOptions
) => {
  return (Component: React.ComponentType<P>): React.FC<P> => {
    const WrappedComponent: React.FC<P> = (props) => {
      const { isAuthenticated, isLoading, hasAnyRole, hasAllRoles } = usePermissions();
      const location = useLocation();

      // Show loader while checking permissions
      if (isLoading) {
        return <PageLoader message="Checking permissions..." />;
      }

      // Redirect unauthenticated users
      if (!isAuthenticated) {
        const loginPath = options?.unauthenticatedTo || '/home';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
      }

      // Check permissions
      const hasPermission = options?.requireAll
        ? hasAllRoles(allowedRoles)
        : hasAnyRole(allowedRoles);

      if (!hasPermission) {
        const unauthorizedPath = options?.unauthorizedTo || '/home';
        return <Navigate to={unauthorizedPath} replace />;
      }

      return <Component {...props} />;
    };

    WrappedComponent.displayName = `withRoles(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
  };
};
