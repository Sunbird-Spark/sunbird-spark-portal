// frontend/src/hooks/usePermissions.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Role } from '../auth/AuthContext';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import permissionService, { Feature } from '../services/PermissionService';

export interface UsePermissionsReturn {
  roles: Role[];
  primaryRole: Role;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAllRoles: (roles: Role[]) => boolean;
  canAccessRoute: (route: string) => boolean;
  canAccessFeature: (feature: Feature) => boolean;
  getDefaultRoute: () => string;
  refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authInfo = await userAuthInfoService.getAuthInfo();
      const backendRoles = authInfo.roles || [];
      
      const normalizedRoles = permissionService.normalizeRoles(backendRoles);
      setRoles(normalizedRoles);
      setIsAuthenticated(authInfo.isAuthenticated);
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
      setError(err as Error);
      setRoles(['GUEST']);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const primaryRole = useMemo(() => {
    return permissionService.getPrimaryRole(roles);
  }, [roles]);

  const hasRole = useCallback(
    (role: Role) => permissionService.hasRole(roles, role),
    [roles]
  );

  const hasAnyRole = useCallback(
    (requiredRoles: Role[]) => permissionService.hasAnyRole(roles, requiredRoles),
    [roles]
  );

  const hasAllRoles = useCallback(
    (requiredRoles: Role[]) => permissionService.hasAllRoles(roles, requiredRoles),
    [roles]
  );

  const canAccessRoute = useCallback(
    (route: string) => permissionService.canAccessRoute(roles, route),
    [roles]
  );

  const canAccessFeature = useCallback(
    (feature: Feature) => permissionService.canAccessFeature(roles, feature),
    [roles]
  );

  const getDefaultRoute = useCallback(
    () => permissionService.getDefaultRoute(roles),
    [roles]
  );

  return {
    roles,
    primaryRole,
    isLoading,
    isAuthenticated,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessRoute,
    canAccessFeature,
    getDefaultRoute,
    refetch: fetchRoles,
  };
}
