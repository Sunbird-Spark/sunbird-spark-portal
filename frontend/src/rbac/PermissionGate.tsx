// frontend/src/rbac/PermissionGate.tsx
import React from 'react';
import { Role } from '../auth/AuthContext';
import { usePermissions } from '../hooks/usePermission';
import { Feature } from '../services/PermissionService';

export interface PermissionGateProps {
  roles?: Role[];
  feature?: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hide?: boolean;
}

export function PermissionGate({
  roles,
  feature,
  children,
  fallback = null,
  hide = false,
}: PermissionGateProps): React.ReactElement | null {
  const {
    hasAnyRole,
    canAccessFeature,
    isLoading,
  } = usePermissions();

  if (isLoading) {
    return hide ? null : <>{fallback}</>;
  }

  let hasPermission = false;

  if (feature) {
    hasPermission = canAccessFeature(feature);
  } else if (roles && roles.length > 0) {
    hasPermission = hasAnyRole(roles);
  } else {
    hasPermission = true;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return hide ? null : <>{fallback}</>;
}
