import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import permissionService, { Feature } from './PermissionService';

describe('PermissionService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hasAnyRole', () => {
    it('returns false when userRoles is empty', () => {
      expect(permissionService.hasAnyRole([], ['CONTENT_CREATOR'])).toBe(false);
    });

    it('returns true when requiredRoles is empty (any role satisfies)', () => {
      expect(permissionService.hasAnyRole(['PUBLIC'], [])).toBe(true);
    });

    it('returns true when user has one of the required roles', () => {
      expect(permissionService.hasAnyRole(['CONTENT_CREATOR', 'PUBLIC'], ['CONTENT_CREATOR'])).toBe(true);
    });

    it('returns false when user has none of the required roles', () => {
      expect(permissionService.hasAnyRole(['PUBLIC'], ['CONTENT_CREATOR', 'ORG_ADMIN'])).toBe(false);
    });
  });

  describe('canAccessFeature', () => {
    it('returns true when user has a role allowed for view_workspace', () => {
      expect(permissionService.canAccessFeature(['CONTENT_CREATOR'], 'view_workspace')).toBe(true);
      expect(permissionService.canAccessFeature(['CONTENT_REVIEWER'], 'view_workspace')).toBe(true);
      expect(permissionService.canAccessFeature(['BOOK_CREATOR'], 'view_workspace')).toBe(true);
      expect(permissionService.canAccessFeature(['BOOK_REVIEWER'], 'view_workspace')).toBe(true);
    });

    it('returns false when user does not have a role for view_workspace', () => {
      expect(permissionService.canAccessFeature(['PUBLIC'], 'view_workspace')).toBe(false);
    });

    it('returns false and warns for an unknown feature', () => {
      const result = permissionService.canAccessFeature(['CONTENT_CREATOR'], 'unknown_feature' as Feature);
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown feature encountered in canAccessFeature: unknown_feature')
      );
    });
  });

  describe('normalizeRoles', () => {
    it('filters out ANONYMOUS roles', () => {
      const result = permissionService.normalizeRoles(['ANONYMOUS', 'CONTENT_CREATOR']);
      expect(result).not.toContain('ANONYMOUS');
      expect(result).toContain('CONTENT_CREATOR');
    });

    it('returns PUBLIC when all roles are unknown or ANONYMOUS', () => {
      const result = permissionService.normalizeRoles(['ANONYMOUS', 'UNKNOWN_ROLE']);
      expect(result).toEqual(['PUBLIC']);
    });

    it('returns PUBLIC when input is empty', () => {
      const result = permissionService.normalizeRoles([]);
      expect(result).toEqual(['PUBLIC']);
    });

    it('preserves all known roles', () => {
      const knownRoles = ['CONTENT_CREATOR', 'CONTENT_REVIEWER', 'BOOK_CREATOR', 'BOOK_REVIEWER', 'PUBLIC', 'ORG_ADMIN', 'COURSE_MENTOR'];
      const result = permissionService.normalizeRoles(knownRoles);
      expect(result).toEqual(knownRoles);
    });

    it('warns and skips unknown roles', () => {
      permissionService.normalizeRoles(['CONTENT_CREATOR', 'MYSTERY_ROLE']);
      expect(console.warn).toHaveBeenCalledWith('Unknown role encountered: MYSTERY_ROLE');
    });
  });
});
