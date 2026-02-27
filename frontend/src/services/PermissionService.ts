// frontend/src/services/PermissionService.ts
import { Role } from '../auth/AuthContext';

export type Feature = 'view_workspace';

const FEATURE_PERMISSIONS: Record<Feature, Role[]> = {
  view_workspace: ['CONTENT_CREATOR', 'CONTENT_REVIEWER', 'BOOK_CREATOR', 'BOOK_REVIEWER'],
};

class PermissionService {
  hasAnyRole(userRoles: string[], requiredRoles: Role[]): boolean {
    if (userRoles.length === 0) return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some(role => userRoles.includes(role));
  }

  canAccessFeature(userRoles: string[], feature: Feature): boolean {
    const allowedRoles = FEATURE_PERMISSIONS[feature];
    if (!allowedRoles) {
      console.warn(`Unknown feature encountered in canAccessFeature: ${feature}`);
      return false;
    }
    return this.hasAnyRole(userRoles, allowedRoles);
  }

  normalizeRoles(backendRoles: string[]): Role[] {
    const validRoles: Role[] = [];
    const knownRoles: Role[] = ['CONTENT_CREATOR', 'CONTENT_REVIEWER', 'BOOK_CREATOR', 'BOOK_REVIEWER', 'PUBLIC', 'ORG_ADMIN'];

    for (const role of backendRoles) {
      if (role === 'ANONYMOUS') {
        continue; // unauthenticated — isAuthenticated flag handles redirects
      }

      if (knownRoles.includes(role as Role)) {
        validRoles.push(role as Role);
      } else {
        console.warn(`Unknown role encountered: ${role}`);
      }
    }

    return validRoles.length > 0 ? validRoles : ['PUBLIC'];
  }
}

export const permissionService = new PermissionService();
export default permissionService;
