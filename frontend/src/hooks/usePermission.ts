// frontend/src/hooks/usePermission.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Role } from '../auth/AuthContext';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';
import { UserService } from '../services/UserService';
import permissionService, { Feature } from '../services/PermissionService';

const userService = new UserService();

export interface UsePermissionsReturn {
  roles: Role[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  hasAnyRole: (roles: Role[]) => boolean;
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

      setIsAuthenticated(authInfo.isAuthenticated);

      if (authInfo.isAuthenticated && authInfo.uid) {
        const rolesResponse = await userService.getUserRoles(authInfo.uid);
        if (!isMountedRef.current) return;
        const rawRoles = (rolesResponse.data.response.roles || []).map(
          (r: { role: string } | string) => typeof r === 'string' ? r : r.role
        );
        console.log('[usePermissions] Raw roles from user read API:', rawRoles);
        const normalizedRoles = permissionService.normalizeRoles(rawRoles);
        console.log('[usePermissions] Normalized roles:', normalizedRoles);
        setRoles(normalizedRoles);
      } else {
        setRoles(['PUBLIC']);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Failed to fetch user roles:', err);
      setError(err as Error);
      const status = (err as { response?: { status?: number }; status?: number })?.response?.status ?? (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        setRoles(['PUBLIC']);
        setIsAuthenticated(false);
      } else {
        setRoles(prev => prev.length ? prev : ['PUBLIC']);
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
    error,
    hasAnyRole,
    canAccessFeature,
    refetch: fetchRoles,
  };
}
