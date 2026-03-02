// frontend/src/hooks/usePermission.ts
import { Role } from '../auth/AuthContext';
import { Feature } from '../services/PermissionService';
import { usePermissionsContext } from '../rbac/PermissionsContext';

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
  return usePermissionsContext();
}
