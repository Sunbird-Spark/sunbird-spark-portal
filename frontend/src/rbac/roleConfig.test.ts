import { describe, it, expect } from 'vitest';
import { 
  getDefaultRouteForRole, 
  canRoleAccessRoute, 
  getAllowedRoutesForRole,
  getRoleDisplayName,
  ROLE_CONFIGS 
} from './roleConfig';

describe('roleConfig', () => {
  describe('getDefaultRouteForRole', () => {
    it('returns reports route for admin role', () => {
      expect(getDefaultRouteForRole('ADMIN')).toBe('/reports');
    });

    it('returns workspace route for content_creator role', () => {
      expect(getDefaultRouteForRole('CONTENT_CREATOR')).toBe('/workspace');
    });

    it('returns workspace route for content_reviewer role', () => {
      expect(getDefaultRouteForRole('CONTENT_REVIEWER')).toBe('/workspace');
    });

    it('returns home route for guest role', () => {
      expect(getDefaultRouteForRole('GUEST')).toBe('/home');
    });
  });

  describe('canRoleAccessRoute', () => {
    it('allows admin to access admin route', () => {
      expect(canRoleAccessRoute('ADMIN', '/admin')).toBe(true);
    });

    it('allows admin to access reports route', () => {
      expect(canRoleAccessRoute('ADMIN', '/reports')).toBe(true);
    });

    it('denies guest access to admin route', () => {
      expect(canRoleAccessRoute('GUEST', '/admin')).toBe(false);
    });

    it('allows content_creator to access workspace', () => {
      expect(canRoleAccessRoute('CONTENT_CREATOR', '/workspace')).toBe(true);
    });

    it('allows content_creator to access create route', () => {
      expect(canRoleAccessRoute('CONTENT_CREATOR', '/create')).toBe(true);
    });

    it('denies content_reviewer access to create route', () => {
      expect(canRoleAccessRoute('CONTENT_REVIEWER', '/create')).toBe(false);
    });
  });

  describe('getAllowedRoutesForRole', () => {
    it('returns correct routes for admin', () => {
      const routes = getAllowedRoutesForRole('ADMIN');
      expect(routes).toContain('/admin');
      expect(routes).toContain('/reports');
    });

    it('returns correct routes for content_creator', () => {
      const routes = getAllowedRoutesForRole('CONTENT_CREATOR');
      expect(routes).toContain('/workspace');
      expect(routes).toContain('/create');
    });

    it('returns correct routes for guest', () => {
      const routes = getAllowedRoutesForRole('GUEST');
      expect(routes).toContain('/home');
      expect(routes).toContain('/unauthorized');
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns display name for admin', () => {
      expect(getRoleDisplayName('ADMIN')).toBe('Admin');
    });

    it('returns display name for content_creator', () => {
      expect(getRoleDisplayName('CONTENT_CREATOR')).toBe('Content Creator');
    });

    it('returns display name for content_reviewer', () => {
      expect(getRoleDisplayName('CONTENT_REVIEWER')).toBe('Content Reviewer');
    });

    it('returns display name for guest', () => {
      expect(getRoleDisplayName('GUEST')).toBe('Guest');
    });
  });

  describe('ROLE_CONFIGS', () => {
    it('has configuration for all roles', () => {
      expect(ROLE_CONFIGS.ADMIN).toBeDefined();
      expect(ROLE_CONFIGS.CONTENT_CREATOR).toBeDefined();
      expect(ROLE_CONFIGS.CONTENT_REVIEWER).toBeDefined();
      expect(ROLE_CONFIGS.GUEST).toBeDefined();
    });
  });
});
