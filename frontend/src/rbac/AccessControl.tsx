import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';

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
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !user) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/home?next=${next}`} replace />;
    }

    // Check if user's role is allowed
    if (!rule.allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...props} />;
  };
}
