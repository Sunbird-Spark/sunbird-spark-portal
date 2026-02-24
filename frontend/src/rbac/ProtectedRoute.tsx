// frontend/src/rbac/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '../auth/AuthContext';
import { usePermissions } from '../hooks/usePermission';
import PageLoader from '../components/common/PageLoader';

export interface ProtectedRouteProps {
  allowedRoles: Role[];
  requireAll?: boolean;
  unauthorizedTo?: string;
  unauthenticatedTo?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ProtectedRoute({
  allowedRoles,
  requireAll = false,
  unauthorizedTo = '/unauthorized',
  unauthenticatedTo = '/home',
  fallback,
  children,
}: ProtectedRouteProps): React.ReactElement {
  const {
    isAuthenticated,
    isLoading,
    hasAnyRole,
    hasAllRoles,
  } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return fallback ? <>{fallback}</> : <PageLoader message="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={unauthenticatedTo} state={{ from: location }} replace />;
  }

  const hasPermission = requireAll
    ? hasAllRoles(allowedRoles)
    : hasAnyRole(allowedRoles);

  if (!hasPermission) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return <>{children}</>;
}
