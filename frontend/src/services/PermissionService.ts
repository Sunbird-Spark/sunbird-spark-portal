// frontend/src/services/PermissionService.ts
import { Role } from '../auth/AuthContext';
import { ROLE_CONFIGS } from '../rbac/roleConfig';

export type Feature =
  | 'create_content'
  | 'edit_content'
  | 'delete_content'
  | 'review_content'
  | 'publish_content'
  | 'view_workspace'
  | 'view_reports'
  | 'manage_users';

const FEATURE_PERMISSIONS: Record<Feature, Role[]> = {
  create_content: ['ADMIN', 'CONTENT_CREATOR'],
  edit_content: ['ADMIN', 'CONTENT_CREATOR'],
  delete_content: ['ADMIN', 'CONTENT_CREATOR'],
  review_content: ['ADMIN', 'CONTENT_REVIEWER'],
  publish_content: ['ADMIN'],
  view_workspace: ['ADMIN', 'CONTENT_CREATOR', 'CONTENT_REVIEWER'],
  view_reports: ['ADMIN'],
  manage_users: ['ADMIN'],
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

  canAccessRoute(userRoles: string[], route: string): boolean {
    const roles = userRoles.length > 0 ? userRoles : ['GUEST'];
    return roles.some(role => {
      const config = ROLE_CONFIGS[role as Role];
      return config?.allowedRoutes.includes(route) || false;
    });
  }

  getDefaultRoute(userRoles: string[]): string {
    const primaryRole = this.getPrimaryRole(userRoles);
    return ROLE_CONFIGS[primaryRole]?.defaultRoute || '/home';
  }

  canAccessFeature(userRoles: string[], feature: Feature): boolean {
    const allowedRoles = FEATURE_PERMISSIONS[feature];
    if (!allowedRoles) return false;
    return this.hasAnyRole(userRoles, allowedRoles);
  }

  getPrimaryRole(userRoles: string[]): Role {
    if (userRoles.length === 0) return 'GUEST';
    const roleOrder: Role[] = ['ADMIN', 'CONTENT_CREATOR', 'CONTENT_REVIEWER', 'GUEST'];
    return roleOrder.find(role => userRoles.includes(role)) ?? 'GUEST';
  }

  normalizeRoles(backendRoles: string[]): Role[] {
    const validRoles: Role[] = [];
    const knownRoles: Role[] = ['ADMIN', 'CONTENT_CREATOR', 'CONTENT_REVIEWER', 'GUEST'];

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
