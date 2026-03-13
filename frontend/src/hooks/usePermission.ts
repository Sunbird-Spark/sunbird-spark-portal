// frontend/src/hooks/usePermission.ts
import { useMemo, useCallback } from 'react';
import { Role } from '../auth/AuthContext';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import permissionService, { Feature } from '../services/PermissionService';
import { useUserRead } from './useUserRead';

export interface UsePermissionsReturn {
  roles: Role[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  hasAnyRole: (roles: Role[]) => boolean;
  canAccessFeature: (feature: Feature) => boolean;
  refetch: () => Promise<void>;
}

// Reads roles from the shared useUserRead cache (which already fetches the
// `roles` field). This avoids a separate getUserRoles API call on every
// ProtectedRoute mount and benefits from the same 1 hour staleTime.
export function usePermissions(): UsePermissionsReturn {
  const isAuthenticated = userAuthInfoService.isUserAuthenticated();
  const { data: userReadData, isLoading, error, refetch } = useUserRead();

  const roles = useMemo<Role[]>(() => {
    if (!isAuthenticated) return ['PUBLIC'];
    const rawRoles = (userReadData?.data?.response?.roles ?? []).map(
      (r: { role: string } | string) => (typeof r === 'string' ? r : r.role)
    );
    if (rawRoles.length === 0) return ['PUBLIC'];
    return permissionService.normalizeRoles(rawRoles) as Role[];
  }, [isAuthenticated, userReadData]);

  const hasAnyRole = useCallback(
    (requiredRoles: Role[]) => permissionService.hasAnyRole(roles, requiredRoles),
    [roles]
  );

  const canAccessFeature = useCallback(
    (feature: Feature) => permissionService.canAccessFeature(roles, feature),
    [roles]
  );

  return {
    roles,
    isLoading,
    isAuthenticated,
    error: error ?? null,
    hasAnyRole,
    canAccessFeature,
    refetch: async () => { await refetch(); },
  };
}
