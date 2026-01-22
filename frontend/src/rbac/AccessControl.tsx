import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';
import { canRoleAccessRoute } from './roleConfig';

interface AccessControlRule {
  allowedRoles?: Role[];
  requiredRoute?: string;
}

export function withAccessControl<P extends object>(
  Component: React.ComponentType<P>,
  rule: AccessControlRule
) {
  return function Wrapped(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!isAuthenticated || !user) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/home?next=${next}`} replace />;
    }

    // Check if user's role is allowed
    if (rule.allowedRoles && !rule.allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // Check if user's role can access the required route
    if (rule.requiredRoute && !canRoleAccessRoute(user.role, rule.requiredRoute)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...props} />;
  };
}
