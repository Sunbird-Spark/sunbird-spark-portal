// frontend/src/services/PermissionService.ts
import { Role } from '../auth/AuthContext';

export type Feature =
  | 'create_content'
  | 'edit_content'
  | 'delete_content'
  | 'review_content'
  | 'view_workspace';

const FEATURE_PERMISSIONS: Record<Feature, Role[]> = {
  create_content: ['CONTENT_CREATOR'],
  edit_content: ['CONTENT_CREATOR'],
  delete_content: ['CONTENT_CREATOR'],
  review_content: ['CONTENT_REVIEWER'],
  view_workspace: ['CONTENT_CREATOR', 'CONTENT_REVIEWER'],
};

class PermissionService {
  hasRole(userRoles: string[], requiredRole: Role): boolean {
    return userRoles.includes(requiredRole);
  }

  hasAnyRole(userRoles: string[], requiredRoles: Role[]): boolean {
    if (userRoles.length === 0) return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some(role => userRoles.includes(role));
  }

  hasAllRoles(userRoles: string[], requiredRoles: Role[]): boolean {
    if (userRoles.length === 0) return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.every(role => userRoles.includes(role));
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
    const knownRoles: Role[] = ['CONTENT_CREATOR', 'CONTENT_REVIEWER', 'GUEST'];

    for (const role of backendRoles) {
      if (role === 'PUBLIC' || role === 'ANONYMOUS') {
        if (!validRoles.includes('GUEST')) {
          validRoles.push('GUEST');
        }
        continue;
      }

      if (knownRoles.includes(role as Role)) {
        validRoles.push(role as Role);
      } else {
        console.warn(`Unknown role encountered: ${role}`);
      }
    }

    return validRoles.length > 0 ? validRoles : ['GUEST'];
  }
}

export const permissionService = new PermissionService();
export default permissionService;
