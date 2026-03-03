import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '../auth/AuthContext';
import { usePermissions } from '../hooks/usePermission';

/**
 * Access control rule for protecting components
 */
interface AccessControlRule {
  /** Only these roles can access this component */
  allowedRoles: Role[];
}

export function withAccessControl<P extends object>(
  Component: React.ComponentType<P>,
  rule: AccessControlRule
) {
  return function Wrapped(props: P) {
    const { isAuthenticated, hasAnyRole } = usePermissions();
    const location = useLocation();

    if (!isAuthenticated) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/home?next=${next}`} replace />;
    }

    // Check if user has any of the allowed roles
    const hasPermission = hasAnyRole(rule.allowedRoles);
    
    if (!hasPermission) {
      return <Navigate to="/home" replace />;
    }

    return <Component {...props} />;
  };
}
