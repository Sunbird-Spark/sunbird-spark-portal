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
      expect(getDefaultRouteForRole('admin')).toBe('/reports');
    });

    it('returns workspace route for content_creator role', () => {
      expect(getDefaultRouteForRole('content_creator')).toBe('/workspace');
    });

    it('returns workspace route for content_reviewer role', () => {
      expect(getDefaultRouteForRole('content_reviewer')).toBe('/workspace');
    });

    it('returns home route for guest role', () => {
      expect(getDefaultRouteForRole('guest')).toBe('/home');
    });
  });

  describe('canRoleAccessRoute', () => {
    it('allows admin to access admin route', () => {
      expect(canRoleAccessRoute('admin', '/admin')).toBe(true);
    });

    it('allows admin to access reports route', () => {
      expect(canRoleAccessRoute('admin', '/reports')).toBe(true);
    });

    it('denies guest access to admin route', () => {
      expect(canRoleAccessRoute('guest', '/admin')).toBe(false);
    });

    it('allows content_creator to access workspace', () => {
      expect(canRoleAccessRoute('content_creator', '/workspace')).toBe(true);
    });

    it('allows content_creator to access create route', () => {
      expect(canRoleAccessRoute('content_creator', '/create')).toBe(true);
    });

    it('denies content_reviewer access to create route', () => {
      expect(canRoleAccessRoute('content_reviewer', '/create')).toBe(false);
    });
  });

  describe('getAllowedRoutesForRole', () => {
    it('returns correct routes for admin', () => {
      const routes = getAllowedRoutesForRole('admin');
      expect(routes).toContain('/admin');
      expect(routes).toContain('/reports');
    });

    it('returns correct routes for content_creator', () => {
      const routes = getAllowedRoutesForRole('content_creator');
      expect(routes).toContain('/workspace');
      expect(routes).toContain('/create');
    });

    it('returns correct routes for guest', () => {
      const routes = getAllowedRoutesForRole('guest');
      expect(routes).toContain('/home');
      expect(routes).toContain('/unauthorized');
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns display name for admin', () => {
      expect(getRoleDisplayName('admin')).toBe('Admin');
    });

    it('returns display name for content_creator', () => {
      expect(getRoleDisplayName('content_creator')).toBe('Content Creator');
    });

    it('returns display name for content_reviewer', () => {
      expect(getRoleDisplayName('content_reviewer')).toBe('Content Reviewer');
    });

    it('returns display name for guest', () => {
      expect(getRoleDisplayName('guest')).toBe('Guest');
    });
  });

  describe('ROLE_CONFIGS', () => {
    it('has configuration for all roles', () => {
      expect(ROLE_CONFIGS.admin).toBeDefined();
      expect(ROLE_CONFIGS.content_creator).toBeDefined();
      expect(ROLE_CONFIGS.content_reviewer).toBeDefined();
      expect(ROLE_CONFIGS.guest).toBeDefined();
    });
  });
});
