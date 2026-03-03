import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GenericEditorService } from './GenericEditorService';
import type { ContentDetails, GenericEditorQueryParams } from './types';
import { GENERIC_EDITOR_MIME_TYPES } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import {
  GENERIC_EDITOR_WINDOW_CONFIG,
  DEFAULT_EXT_CONT_WHITELISTED_DOMAINS,
  DEFAULT_VIDEO_MAX_SIZE,
  DEFAULT_CONTENT_FILE_SIZE,
  DEFAULT_PRIMARY_CATEGORIES,
} from './editorConfig';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../../lib/http-client', () => ({
  getClient: () => ({
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  }),
}));

vi.mock('../../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn(() => 'session-abc'),
    getUserId: vi.fn(() => 'user-123'),
  },
}));

vi.mock('../../AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn(() => Promise.resolve('device-456')),
    getPData: vi.fn(() =>
      Promise.resolve({ id: 'test.portal', ver: '2.0', pid: 'test-pid' })
    ),
  },
}));

const mockOrgSearch = vi.fn();

vi.mock('../../OrganizationService', () => ({
  OrganizationService: class {
    search = mockOrgSearch;
  },
}));

const mockChannelRead = vi.fn();

vi.mock('../../ChannelService', () => ({
  ChannelService: class {
    read = mockChannelRead;
  },
}));

vi.mock('../../UserProfileService', () => ({
  default: { getChannel: vi.fn(), clearCache: vi.fn() },
}));

import userProfileService from '../../UserProfileService';

describe('GenericEditorService', () => {
  let service: GenericEditorService;

  const mockContentDetails: ContentDetails = {
    identifier: 'do_123',
    name: 'Test PDF',
    status: 'Draft',
    mimeType: 'application/pdf',
    createdBy: 'user-123',
    framework: 'NCF',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(userProfileService.getChannel).mockResolvedValue('test-slug');

    mockOrgSearch.mockResolvedValue({
      data: {
        response: {
          content: [
            {
              channel: 'test-channel',
              hashTagId: 'test-channel',
              identifier: 'org-1',
            },
          ],
        },
      },
    });

    mockChannelRead.mockResolvedValue({
      data: {
        channel: {
          defaultFramework: 'TPD',
        },
      },
    });

    service = new GenericEditorService();
  });

  afterEach(() => {
    delete (window as any).context;
    delete (window as any).config;
  });

  describe('getEditorUrl', () => {
    it('should return the default generic editor URL', () => {
      expect(service.getEditorUrl()).toBe('/generic-editor/index.html');
    });
  });

  describe('getContentDetails', () => {
    it('should make correct API call and return content', async () => {
      mockGet.mockResolvedValue({
        data: { content: mockContentDetails },
      });

      const result = await service.getContentDetails('do_123');

      expect(mockGet).toHaveBeenCalledWith('/content/v1/read/do_123?mode=edit');
      expect(result).toEqual(mockContentDetails);
    });
  });

  describe('lockContent', () => {
    it('should send correct payload and return lock response', async () => {
      const lockResponse = {
        lockKey: 'lock-key-1',
        expiresAt: '2026-02-19T00:00:00Z',
        expiresIn: '3600',
      };
      mockPost.mockResolvedValue({ data: lockResponse });

      const result = await service.lockContent(
        'do_123',
        'user-123',
        'Test User',
        'NCF',
        'Resource'
      );

      expect(mockPost).toHaveBeenCalledWith('/lock/v1/create', {
        request: {
          resourceId: 'do_123',
          resourceType: 'Content',
          resourceInfo: JSON.stringify({
            contentType: 'Resource',
            framework: 'NCF',
            identifier: 'do_123',
          }),
          creatorInfo: JSON.stringify({ name: 'Test User', id: 'user-123' }),
          createdBy: 'user-123',
        },
      });
      expect(result).toEqual(lockResponse);
    });

    it('should use default values when framework and contentType are not provided', async () => {
      mockPost.mockResolvedValue({
        data: { lockKey: 'k', expiresAt: 'a', expiresIn: 'i' },
      });

      await service.lockContent('do_456', 'user-1', 'User');

      expect(mockPost).toHaveBeenCalledWith('/lock/v1/create', {
        request: expect.objectContaining({
          resourceInfo: JSON.stringify({
            contentType: 'Resource',
            framework: '',
            identifier: 'do_456',
          }),
        }),
      });
    });
  });

  describe('retireLock', () => {
    it('should send correct payload to retire lock', async () => {
      mockDelete.mockResolvedValue({ data: {} });

      await service.retireLock('do_123');

      expect(mockDelete).toHaveBeenCalledWith('/lock/v1/retire', {
        request: {
          resourceId: 'do_123',
          resourceType: 'Content',
        },
      });
    });
  });

  describe('validateRequest', () => {
    it('should return true for valid mime type, valid status, and creator', () => {
      const result = service.validateRequest(mockContentDetails, 'user-123');
      expect(result).toBe(true);
    });

    it('should return true for collaborator with valid state', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        createdBy: 'other-user',
        collaborators: ['user-123'],
      };
      const result = service.validateRequest(content, 'user-123', 'collaborating-on');
      expect(result).toBe(true);
    });

    it('should return true for valid state even if not creator or collaborator', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        createdBy: 'other-user',
      };
      const result = service.validateRequest(content, 'user-123', 'upForReview');
      expect(result).toBe(true);
    });

    it('should return false for invalid mime type', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        mimeType: 'application/vnd.ekstep.ecml-archive',
      };
      const result = service.validateRequest(content, 'user-123');
      expect(result).toBe(false);
    });

    it('should return false for invalid status', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        status: 'Retired',
      };
      const result = service.validateRequest(content, 'user-123');
      expect(result).toBe(false);
    });

    it('should return false when user has no access and no valid state', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        createdBy: 'other-user',
      };
      const result = service.validateRequest(content, 'user-123');
      expect(result).toBe(false);
    });

    it('should handle case-insensitive status comparison', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        status: 'draft',
      };
      const result = service.validateRequest(content, 'user-123');
      expect(result).toBe(true);
    });

    it('should validate all supported mime types', () => {
      for (const mimeType of GENERIC_EDITOR_MIME_TYPES) {
        const content: ContentDetails = {
          ...mockContentDetails,
          mimeType,
        };
        expect(service.validateRequest(content, 'user-123')).toBe(true);
      }
    });
  });

  describe('buildEditorContext', () => {
    it('should build correct context object with all fields', async () => {
      const context = await service.buildEditorContext({
        contentId: 'do_123',
        framework: 'TPD',
      });

      expect(vi.mocked(userProfileService.getChannel)).toHaveBeenCalled();
      expect(mockOrgSearch).toHaveBeenCalledWith({
        filters: { slug: 'test-slug', isTenant: true },
      });
      expect(context.user.id).toBe('user-123');
      expect(context.sid).toBe('session-abc');
      expect(context.did).toBe('device-456');
      expect(context.contentId).toBe('do_123');
      expect(context.channel).toBe('test-channel');
      expect(context.framework).toBe('TPD');
      expect(context.defaultLicense).toBe('CC BY 4.0');
      expect(context.env).toBe('generic-editor');
      expect(context.instance).toBe('SUNBIRD');
      expect(context.ownershipType).toEqual(['createdBy']);
      expect(context.primaryCategories).toEqual([...DEFAULT_PRIMARY_CATEGORIES]);
      expect(context.pdata).toEqual({
        id: 'test.portal',
        ver: '2.0',
        pid: 'sunbird-portal',
      });
      expect(context.contextRollUp).toEqual({ l1: 'test-channel' });
    });

    it('should use fallback session ID when not available', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue(null);

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.sid).toMatch(/^session-\d+$/);
    });

    it('should use anonymous when userId is not available', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.user.id).toBe('anonymous');
    });

    it('should use empty string when device ID fails', async () => {
      vi.mocked(appCoreService.getDeviceId).mockRejectedValue(new Error('fail'));

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.did).toBe('');
    });

    it('should use empty slug when user profile channel is empty', async () => {
      vi.mocked(userProfileService.getChannel).mockResolvedValue('');

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(mockOrgSearch).toHaveBeenCalledWith({
        filters: { isTenant: true },
      });
      expect(context.channel).toBe('test-channel');
    });

    it('should use empty string when org service fails', async () => {
      mockOrgSearch.mockRejectedValue(new Error('network error'));

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.channel).toBe('');
    });

    it('should fetch default framework from channel when not provided', async () => {
      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(mockChannelRead).toHaveBeenCalledWith('test-channel');
      expect(context.framework).toBe('TPD');
    });

    it('should default to empty string when no framework available', async () => {
      mockOrgSearch.mockResolvedValue({
        data: { response: { content: [] } },
      });

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.framework).toBe('');
    });

    it('should not fetch channel framework when provided in params', async () => {
      const context = await service.buildEditorContext({
        contentId: 'do_1',
        framework: 'MyFramework',
      });

      expect(mockChannelRead).not.toHaveBeenCalled();
      expect(context.framework).toBe('MyFramework');
    });

    it('should set uploadInfo for large file uploads', async () => {
      const context = await service.buildEditorContext(
        { contentId: 'do_1' },
        undefined,
        true
      );

      expect(context.uploadInfo).toEqual({ isLargeFileUpload: true });
    });

    it('should set uploadInfo when content disposition is online-only', async () => {
      const content: ContentDetails = {
        identifier: 'do_1',
        contentDisposition: 'online-only',
      };

      const context = await service.buildEditorContext(
        { contentId: 'do_1' },
        content
      );

      expect(context.uploadInfo).toEqual({ isLargeFileUpload: true });
    });

    it('should use default pdata when getPData fails', async () => {
      vi.mocked(appCoreService.getPData).mockRejectedValue(new Error('fail'));

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.pdata).toEqual({
        id: 'sunbird.portal',
        ver: '1.0',
        pid: 'sunbird-portal',
      });
    });
  });

  describe('buildEditorConfig', () => {
    it('should return correct config with lock params', () => {
      const lockParams: GenericEditorQueryParams = {
        lockKey: 'key-1',
        expiresAt: '2026-02-19T00:00:00Z',
        expiresIn: '3600',
      };

      const config = service.buildEditorConfig(lockParams, '/logo.png');

      expect(config.corePluginsPackaged).toBe(GENERIC_EDITOR_WINDOW_CONFIG.corePluginsPackaged);
      expect(config.build_number).toBe('1.0');
      expect(config.headerLogo).toBe('/logo.png');
      expect(config.lock).toEqual({
        lockKey: 'key-1',
        expiresAt: '2026-02-19T00:00:00Z',
        expiresIn: '3600',
      });
      expect(config.extContWhitelistedDomains).toBe(DEFAULT_EXT_CONT_WHITELISTED_DOMAINS);
      expect(config.enableTelemetryValidation).toBe(false);
      expect(config.videoMaxSize).toBe(DEFAULT_VIDEO_MAX_SIZE);
      expect(config.defaultContentFileSize).toBe(DEFAULT_CONTENT_FILE_SIZE);
    });

    it('should use empty string for headerLogo when not provided', () => {
      const config = service.buildEditorConfig();
      expect(config.headerLogo).toBe('');
    });

    it('should use undefined lock values when no lock params provided', () => {
      const config = service.buildEditorConfig();
      expect(config.lock).toEqual({
        lockKey: undefined,
        expiresAt: undefined,
        expiresIn: undefined,
      });
    });
  });

  describe('shouldLockContent', () => {
    it('should return true for editable state with draft status', () => {
      expect(service.shouldLockContent('draft', 'Draft')).toBe(true);
    });

    it('should return false when existing lock is present', () => {
      expect(
        service.shouldLockContent('draft', 'Draft', { lockKey: 'existing-key' })
      ).toBe(false);
    });

    it('should return false for non-editable state', () => {
      expect(service.shouldLockContent('upForReview', 'Draft')).toBe(false);
    });

    it('should return false for non-draft status', () => {
      expect(service.shouldLockContent('draft', 'Review')).toBe(false);
    });

    it('should return false when state is undefined', () => {
      expect(service.shouldLockContent(undefined, 'Draft')).toBe(false);
    });
  });

  describe('setWindowGlobals', () => {
    it('should set window.context and window.config', () => {
      const context = { user: { id: 'u1' } } as any;
      const config = { modalId: 'genericEditor' } as any;

      service.setWindowGlobals(context, config);

      expect((window as any).context).toBe(context);
      expect((window as any).config).toBe(config);
    });
  });

  describe('clearWindowGlobals', () => {
    it('should remove window.context and window.config', () => {
      (window as any).context = { some: 'context' };
      (window as any).config = { some: 'config' };

      service.clearWindowGlobals();

      expect((window as any).context).toBeUndefined();
      expect((window as any).config).toBeUndefined();
    });
  });
});
