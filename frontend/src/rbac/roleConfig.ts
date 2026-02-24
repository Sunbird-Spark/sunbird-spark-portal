// frontend/src/rbac/roleConfig.ts
import { Role } from '../auth/AuthContext';

interface RoleConfig {
  defaultRoute: string;
  allowedRoutes: string[];
  displayName: string;
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  ADMIN: {
    defaultRoute: '/reports',
    allowedRoutes: ['/admin', '/reports', '/workspace', '/create'],
    displayName: 'Admin',
  },
  CONTENT_CREATOR: {
    defaultRoute: '/workspace',
    allowedRoutes: ['/workspace', '/create'],
    displayName: 'Content Creator',
  },
  CONTENT_REVIEWER: {
    defaultRoute: '/workspace',
    allowedRoutes: ['/workspace'],
    displayName: 'Content Reviewer',
  },
  GUEST: {
    defaultRoute: '/home',
    allowedRoutes: ['/home', '/unauthorized'],
    displayName: 'Guest',
  },
};

export const getDefaultRouteForRole = (role: Role): string => {
  return ROLE_CONFIGS[role]?.defaultRoute || '/home';
};

export const canRoleAccessRoute = (role: Role, route: string): boolean => {
  const config = ROLE_CONFIGS[role];
  return config?.allowedRoutes.includes(route) || false;
};

export const getAllowedRoutesForRole = (role: Role): string[] => {
  return ROLE_CONFIGS[role]?.allowedRoutes || [];
};

export const getRoleDisplayName = (role: Role): string => {
  return ROLE_CONFIGS[role]?.displayName || role;
};
