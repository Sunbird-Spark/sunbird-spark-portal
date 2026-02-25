// frontend/src/hooks/usePermission.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Role } from '../auth/AuthContext';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import permissionService, { Feature } from '../services/PermissionService';

export interface UsePermissionsReturn {
  roles: Role[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAllRoles: (roles: Role[]) => boolean;
  canAccessFeature: (feature: Feature) => boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authInfo = await userAuthInfoService.getAuthInfo();
      if (!isMountedRef.current) return;

      const backendRoles = authInfo.roles || [];
      const normalizedRoles = permissionService.normalizeRoles(backendRoles);
      setRoles(normalizedRoles);
      setIsAuthenticated(authInfo.isAuthenticated);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Failed to fetch user roles:', err);
      setError(err as Error);
      const status = (err as { response?: { status?: number }; status?: number })?.response?.status ?? (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        setRoles(['GUEST']);
        setIsAuthenticated(false);
      } else {
        setRoles(prev => prev.length ? prev : ['GUEST']);
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRoles();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchRoles]);

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

  const canAccessFeature = useCallback(
    (feature: Feature) => permissionService.canAccessFeature(roles, feature),
    [roles]
  );

  return {
    roles,
    isLoading,
    isAuthenticated,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessFeature,
    refetch: fetchRoles,
  };
}
