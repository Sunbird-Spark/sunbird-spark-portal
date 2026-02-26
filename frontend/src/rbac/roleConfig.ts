import { Role } from '../auth/AuthContext';

/**
 * Configuration for each role including default routes and allowed routes
 */
interface RoleConfig {
  defaultRoute: string;
  allowedRoutes: string[];
  displayName: string;
}

/**
 * Centralized role configuration
 * Single source of truth for role permissions and routing
 */
export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  admin: {
    defaultRoute: '/reports',
    allowedRoutes: ['/admin', '/reports', '/user-management'],
    displayName: 'Admin',
  },
  content_creator: {
    defaultRoute: '/workspace',
    allowedRoutes: ['/workspace', '/create'],
    displayName: 'Content Creator',
  },
  content_reviewer: {
    defaultRoute: '/workspace',
    allowedRoutes: ['/workspace'],
    displayName: 'Content Reviewer',
  },
  guest: {
    defaultRoute: '/home',
    allowedRoutes: ['/home', '/unauthorized'],
    displayName: 'Guest',
  },
};

/**
 * Get the default home route for a given role
 */
export const getDefaultRouteForRole = (role: Role): string => {
  return ROLE_CONFIGS[role]?.defaultRoute || '/home';
};

/**
 * Check if a role has access to a specific route
 */
export const canRoleAccessRoute = (role: Role, route: string): boolean => {
  const config = ROLE_CONFIGS[role];
  return config?.allowedRoutes.includes(route) || false;
};

/**
 * Get all allowed routes for a role
 */
export const getAllowedRoutesForRole = (role: Role): string[] => {
  return ROLE_CONFIGS[role]?.allowedRoutes || [];
};

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: Role): string => {
  return ROLE_CONFIGS[role]?.displayName || role;
};
