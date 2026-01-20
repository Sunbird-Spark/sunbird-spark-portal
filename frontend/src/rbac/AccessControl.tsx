import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AccessProvider';
import type { Permission } from './rolePermissionsMap';

type Rule = { permission: Permission } | { anyOf: Permission[] } | { allOf: Permission[] };

function canAccess(perms: Permission[], rule: Rule) {
  // ✅ global bypass
  if (perms.includes('all_access')) return true;

  if ('permission' in rule) return perms.includes(rule.permission);
  if ('anyOf' in rule) return rule.anyOf.some((p) => perms.includes(p));
  return rule.allOf.every((p) => perms.includes(p));
}

export function withAccessControl<P>(Component: React.ComponentType<P>, rule: Rule) {
  return function Wrapped(props: P) {
    const { user, isLoading, isUnauthenticated, isError } = useAuth();
    const location = useLocation();

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error</div>;

    if (isUnauthenticated) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/home?next=${next}`} replace />;
    }

    return canAccess(user.permissions, rule) ? (
      <Component {...props} />
    ) : (
      <Navigate to="/403" replace />
    );
  };
}
